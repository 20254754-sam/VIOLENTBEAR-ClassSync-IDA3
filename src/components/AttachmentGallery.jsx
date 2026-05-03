import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const formatFileSize = (value) => {
  if (!value) {
    return 'Unknown size';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const AttachmentGallery = ({ attachments = [] }) => {
  const [activeAttachmentId, setActiveAttachmentId] = useState(null);
  const [detailsAttachmentId, setDetailsAttachmentId] = useState(null);

  const activeAttachment = useMemo(
    () => attachments.find((attachment) => attachment.id === activeAttachmentId) || null,
    [activeAttachmentId, attachments]
  );

  useEffect(() => {
    if (!activeAttachment) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveAttachmentId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeAttachment]);

  const lightboxContent = activeAttachment?.isImage ? (
    <div className="attachment-lightbox-overlay" onClick={() => setActiveAttachmentId(null)}>
      <div className="attachment-lightbox" onClick={(event) => event.stopPropagation()}>
        <div className="attachment-lightbox-header">
          <div className="attachment-lightbox-copy">
            <h3>{activeAttachment.name}</h3>
            <p>{activeAttachment.type || 'Image attachment'}</p>
          </div>
          <button type="button" className="upload-popup-button" onClick={() => setActiveAttachmentId(null)}>
            Close
          </button>
        </div>
        <img src={activeAttachment.url} alt={activeAttachment.name} className="attachment-lightbox-image" />
        <div className="attachment-lightbox-footer">
          <small>Press Esc to close</small>
          <a href={activeAttachment.url} download={activeAttachment.name} className="attachment-download-button">
            Download image
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="attachment-view-list">
        {attachments.map((attachment) => {
          const showDetails = detailsAttachmentId === attachment.id;

          return (
            <article key={attachment.id} className="attachment-card">
              <div className="attachment-card-header">
                <div className="attachment-card-copy">
                  <strong>{attachment.name}</strong>
                  <small>{attachment.isImage ? 'Image attachment' : 'File attachment'}</small>
                </div>
                <div className="attachment-card-menu">
                  <button
                    type="button"
                    className="attachment-dots-button"
                    aria-label={`Show details for ${attachment.name}`}
                    onClick={() =>
                      setDetailsAttachmentId((currentId) => (currentId === attachment.id ? null : attachment.id))
                    }
                  >
                    ...
                  </button>
                </div>
              </div>

              {attachment.isImage && (
                <button
                  type="button"
                  className="attachment-image-button"
                  onClick={() => setActiveAttachmentId(attachment.id)}
                >
                  <img src={attachment.url} alt={attachment.name} className="attachment-image-preview" />
                </button>
              )}

              <div className="attachment-card-actions">
                {attachment.isImage ? (
                  <button type="button" className="attachment-view-button" onClick={() => setActiveAttachmentId(attachment.id)}>
                    View image
                  </button>
                ) : (
                  <a href={attachment.url} target="_blank" rel="noreferrer" className="attachment-view-button">
                    Open file
                  </a>
                )}
                <a href={attachment.url} download={attachment.name} className="attachment-download-button">
                  Download
                </a>
              </div>

              {showDetails && (
                <div className="attachment-details-panel">
                  <div className="attachment-details-row">
                    <strong>Name</strong>
                    <span>{attachment.name}</span>
                  </div>
                  <div className="attachment-details-row">
                    <strong>Type</strong>
                    <span>{attachment.type || 'Unknown type'}</span>
                  </div>
                  <div className="attachment-details-row">
                    <strong>Attached</strong>
                    <span>{formatDate(attachment.attachedAt || new Date().toISOString())}</span>
                  </div>
                  <div className="attachment-details-row">
                    <strong>Size</strong>
                    <span>{formatFileSize(attachment.size)}</span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {typeof document !== 'undefined' && lightboxContent
        ? createPortal(lightboxContent, document.body)
        : null}
    </>
  );
};

export default AttachmentGallery;
