using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.OriginalAspectRatio.Services;

/// <summary>
/// Registers the embedded Jellyfin Web enhancement when an optional injector plugin is available.
/// </summary>
public sealed class StartupService : IHostedService
{
    private const string FileTransformationAssemblyName = "Jellyfin.Plugin.FileTransformation";
    private const string FileTransformationInterfaceName = "Jellyfin.Plugin.FileTransformation.PluginInterface";
    private const string JavaScriptInjectorAssemblyName = "Jellyfin.Plugin.JavaScriptInjector";
    private const string JavaScriptInjectorInterfaceName = "Jellyfin.Plugin.JavaScriptInjector.PluginInterface";
    private const string PluginId = "1b77aa92-62b6-43d7-ae75-6ab2251c05a2";
    private const string PluginName = "Original Aspect Ratio Detector";
    private const string ScriptElementId = "original-aspect-ratio-display-script";
    private static readonly Lazy<string?> _script = new(ReadEmbeddedScript);
    private readonly ILogger<StartupService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="StartupService"/> class.
    /// </summary>
    /// <param name="logger">The logger.</param>
    public StartupService(ILogger<StartupService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(_script.Value))
        {
            _logger.LogError("Could not load the embedded aspect-ratio display script.");
            return Task.CompletedTask;
        }

        if (TryRegisterWithJavaScriptInjector(_script.Value))
        {
            return Task.CompletedTask;
        }

        if (TryRegisterWithFileTransformation())
        {
            return Task.CompletedTask;
        }

        _logger.LogInformation("No supported Jellyfin Web injector is available; aspect-ratio detection remains active.");
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>
    /// Injects the embedded script into Jellyfin Web's index document.
    /// </summary>
    /// <param name="payload">The document supplied by File Transformation.</param>
    /// <returns>The transformed document.</returns>
    public static string TransformIndexHtml(FileTransformationPayload payload)
    {
        var contents = payload.Contents ?? string.Empty;
        var script = _script.Value;

        if (string.IsNullOrWhiteSpace(script)
            || contents.Contains(ScriptElementId, StringComparison.Ordinal))
        {
            return contents;
        }

        var scriptElement = $"<script id=\"{ScriptElementId}\">{script}</script>";
        var bodyEnd = contents.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        return bodyEnd >= 0 ? contents.Insert(bodyEnd, scriptElement) : string.Concat(contents, scriptElement);
    }

    private bool TryRegisterWithJavaScriptInjector(string script)
    {
        var registration = new Dictionary<string, object?>
        {
            ["id"] = $"{PluginId}-aspect-ratio-display",
            ["name"] = "Original Aspect Ratio Display",
            ["script"] = script,
            ["enabled"] = true,
            ["requiresAuthentication"] = true,
            ["pluginId"] = PluginId,
            ["pluginName"] = PluginName,
            ["pluginVersion"] = typeof(StartupService).Assembly.GetName().Version?.ToString() ?? "1.1.0.0"
        };

        if (TryInvokeRegistration(
                JavaScriptInjectorAssemblyName,
                JavaScriptInjectorInterfaceName,
                "RegisterScript",
                registration,
                out var result)
            && result is bool registered
            && registered)
        {
            _logger.LogInformation("Registered the aspect-ratio display script with JavaScript Injector.");
            return true;
        }

        return false;
    }

    private bool TryRegisterWithFileTransformation()
    {
        var registration = new Dictionary<string, object?>
        {
            ["id"] = Guid.Parse(PluginId),
            ["fileNamePattern"] = "index.html",
            ["callbackAssembly"] = typeof(StartupService).Assembly.FullName,
            ["callbackClass"] = typeof(StartupService).FullName,
            ["callbackMethod"] = nameof(TransformIndexHtml)
        };

        if (!TryInvokeRegistration(
                FileTransformationAssemblyName,
                FileTransformationInterfaceName,
                "RegisterTransformation",
                registration,
                out _))
        {
            return false;
        }

        _logger.LogInformation("Registered the aspect-ratio display script with File Transformation.");
        return true;
    }

    private bool TryInvokeRegistration(
        string assemblyName,
        string interfaceName,
        string methodName,
        object registration,
        out object? result)
    {
        result = null;

        var pluginInterface = AssemblyLoadContext.All
            .SelectMany(context => context.Assemblies)
            .FirstOrDefault(assembly => string.Equals(assembly.GetName().Name, assemblyName, StringComparison.Ordinal))
            ?.GetType(interfaceName);
        var method = pluginInterface?
            .GetMethods(BindingFlags.Public | BindingFlags.Static)
            .FirstOrDefault(candidate => string.Equals(candidate.Name, methodName, StringComparison.Ordinal)
                && candidate.GetParameters().Length == 1);

        if (method is null)
        {
            return false;
        }

        try
        {
            var parameterType = method.GetParameters()[0].ParameterType;
            var parse = parameterType.GetMethod(
                "Parse",
                BindingFlags.Public | BindingFlags.Static,
                binder: null,
                types: new[] { typeof(string) },
                modifiers: null);
            var payload = parse?.Invoke(null, new object[] { JsonSerializer.Serialize(registration) });

            if (payload is null)
            {
                return false;
            }

            result = method.Invoke(null, new[] { payload });
            return true;
        }
        catch (Exception exception)
        {
            _logger.LogDebug(exception, "Could not register the aspect-ratio display script with {AssemblyName}.", assemblyName);
            return false;
        }
    }

    private static string? ReadEmbeddedScript()
    {
        var assembly = typeof(StartupService).Assembly;
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(name => name.EndsWith(".Web.aspect-ratio-display.js", StringComparison.Ordinal));

        if (resourceName is null)
        {
            return null;
        }

        using var stream = assembly.GetManifestResourceStream(resourceName);
        using var reader = stream is null ? null : new StreamReader(stream);
        return reader?.ReadToEnd();
    }
}
