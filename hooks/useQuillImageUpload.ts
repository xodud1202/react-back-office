import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';

interface QuillImageUploadOptions {
  toolbarOptions: any;
  formats: string[];
  onChange: (value: string) => void;
}

interface QuillImageUploadResult {
  quillRef: React.MutableRefObject<any>;
  quillModules: Record<string, any>;
  quillFormats: string[];
  handleEditorChange: (value: string) => void;
}

/**
 * React-Quill 에디터 이미지 업로드/붙여넣기 처리를 공통화합니다.
 */
const useQuillImageUpload = ({
  toolbarOptions,
  formats,
  onChange,
}: QuillImageUploadOptions): QuillImageUploadResult => {
  const quillRef = useRef<any>(null);
  const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);

  // 데이터 URL을 파일로 변환합니다.
  const convertDataUrlToFile = useCallback(async (dataUrl: string, fileName: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  }, []);

  // 에디터 이미지를 업로드합니다.
  const uploadEditorImage = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/api/upload/editor-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.imageUrl as string | undefined;
  }, []);

  // 에디터 툴바 이미지 업로드 버튼을 처리합니다.
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        return;
      }
      const file = input.files[0];
      try {
        const imageUrl = await uploadEditorImage(file);
        if (!imageUrl) {
          return;
        }
        const quill = quillRef.current?.getEditor();
        const range = quill?.getSelection(true);
        if (quill && range) {
          quill.insertEmbed(range.index, 'image', imageUrl, 'user');
          quill.setSelection(range.index + 1, 0);
        }
      } catch (e) {
        console.error('이미지 업로드를 실패했습니다.', e);
        alert('이미지 업로드를 실패했습니다.');
      }
    };
    input.click();
  }, [uploadEditorImage]);

  // 붙여넣기된 Base64 이미지 데이터를 업로드 URL로 치환합니다.
  const replaceInlineImage = useCallback(async (value: string) => {
    if (isUploadingInlineImage) {
      return;
    }

    const matches = Array.from(value.matchAll(/<img[^>]+src=["'](data:image\/[^"']+)["']/gi));
    if (matches.length === 0) {
      return;
    }

    setIsUploadingInlineImage(true);
    try {
      let replaced = value;
      for (let index = 0; index < matches.length; index += 1) {
        const dataUrl = matches[index][1];
        if (!dataUrl) {
          continue;
        }
        const fileName = `paste_${Date.now()}_${index + 1}.png`;
        const file = await convertDataUrlToFile(dataUrl, fileName);
        const imageUrl = await uploadEditorImage(file);
        if (!imageUrl) {
          continue;
        }
        replaced = replaced.replace(dataUrl, imageUrl);
      }

      if (replaced !== value) {
        onChange(replaced);
      }
    } catch (e) {
      console.error('붙여넣기 이미지 업로드를 실패했습니다.', e);
    } finally {
      setIsUploadingInlineImage(false);
    }
  }, [convertDataUrlToFile, isUploadingInlineImage, onChange, uploadEditorImage]);

  // 에디터 툴바 이미지 업로드 핸들러를 연결합니다.
  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    const toolbar = editor?.getModule?.('toolbar');
    if (toolbar?.addHandler) {
      toolbar.addHandler('image', handleImageUpload);
    }
  }, [handleImageUpload]);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: handleImageUpload,
        },
      },
    }),
    [handleImageUpload, toolbarOptions]
  );

  // 에디터 값 변경 처리를 공통화합니다.
  const handleEditorChange = useCallback((value: string) => {
    onChange(value);
    replaceInlineImage(value);
  }, [onChange, replaceInlineImage]);

  return {
    quillRef,
    quillModules,
    quillFormats: formats,
    handleEditorChange,
  };
};

export default useQuillImageUpload;
