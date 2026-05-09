import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import PropertyRow from './PropertyRow';
import { IFileDialogService } from '../../../services/file-dialog-service';
import { fileDialogService } from '../../../services/file-dialog-service';
import { feedback } from '../../../stores/feedbackStore';
import type { ElementProps } from '../hooks/useElementProps';

interface ImageGroupProps {
  image: NonNullable<ElementProps['image']>;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
  fileDialogService?: IFileDialogService;
}

const ImageGroup: React.FC<ImageGroupProps> = ({ image, onChange, fileDialogService: dialogService = fileDialogService }) => (
  <PropertyGroupTitle title="图片">
    <PropertyRow label="图片路径" codeAttr="url">
      <div className="image-url-row">
        <input
          type="text"
          className="image-url-input"
          value={image.url}
          onChange={(e) => onChange('url', e.target.value)}
        />
        <button
          className="image-browse-btn"
          onClick={async () => {
            try {
              const filePaths = await dialogService.openFileDialog({
                properties: ['openFile'],
                filters: [
                  { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              if (filePaths && filePaths.length > 0) {
                onChange('url', filePaths[0]);
              }
            } catch (error) {
              console.error('Error opening file dialog:', error);
              feedback.toast.error('Failed to open file dialog');
            }
          }}
        >
          ...
        </button>
      </div>
    </PropertyRow>
  </PropertyGroupTitle>
);

export default ImageGroup;
