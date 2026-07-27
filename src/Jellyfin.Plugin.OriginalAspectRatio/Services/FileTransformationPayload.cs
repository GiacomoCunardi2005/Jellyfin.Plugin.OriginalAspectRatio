namespace Jellyfin.Plugin.OriginalAspectRatio.Services;

/// <summary>
/// The document supplied by File Transformation.
/// </summary>
public sealed class FileTransformationPayload
{
    /// <summary>
    /// Gets or sets the current document contents.
    /// </summary>
    public string? Contents { get; set; }
}
