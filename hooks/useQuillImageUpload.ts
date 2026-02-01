import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';

interface QuillImageUploadOptions {
  toolbarOptions: any;
  formats: string[];
  onChange: (value: string) => void;
  editorId?: string;
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
  editorId,
}: QuillImageUploadOptions): QuillImageUploadResult => {
  const quillRef = useRef<any>(null);
  const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);

  // 에디터 ID로 Quill 인스턴스를 찾습니다.
  const resolveEditorById = useCallback(() => {
    if (!editorId || typeof document === 'undefined') {
      return null;
    }
    const root = document.getElementById(editorId);
    if (!root) {
      return null;
    }
    const editor = (root as any).__quill;
    if (editor && typeof editor.insertEmbed === 'function') {
      return editor;
    }
    const container = root.querySelector('.ql-container') || root;
    const QuillGlobal = (typeof window !== 'undefined' ? (window as any).Quill : null);
    if (QuillGlobal && typeof QuillGlobal.find === 'function') {
      const quill = QuillGlobal.find(container as any);
      if (quill && typeof (quill as any).insertEmbed === 'function') {
        return quill as any;
      }
    }
    return null;
  }, [editorId]);

  // Quill 인스턴스를 안전하게 가져옵니다.
  const resolveEditor = useCallback(() => {
    const ref = quillRef.current;
    if (!ref) {
      return resolveEditorById();
    }
    if (typeof ref.getEditor === 'function') {
      return ref.getEditor();
    }
    if (ref.editor) {
      return ref.editor;
    }
    if (typeof ref.insertEmbed === 'function') {
      return ref;
    }
    return resolveEditorById();
  }, [resolveEditorById]);

  // Quill 인스턴스를 재시도해서 가져옵니다.
  const resolveEditorWithRetry = useCallback(async (retryCount = 5, delayMs = 80) => {
    for (let i = 0; i < retryCount; i += 1) {
      const editor = resolveEditor();
      if (editor && typeof editor.insertEmbed === 'function') {
        return editor;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return null;
  }, [resolveEditor]);

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
    const imageUrl = response.data?.imageUrl as string | undefined;
    if (!imageUrl) {
      const message = response.data?.error || response.data?.message || '이미지 업로드 응답이 올바르지 않습니다.';
      throw new Error(message);
    }
    return imageUrl;
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
        const quill = await resolveEditorWithRetry();
        if (!quill || typeof quill.insertEmbed !== 'function') {
          throw new Error('에디터를 찾을 수 없습니다.');
        }
        const range = quill.getSelection?.(true);
        const insertIndex = range ? range.index : quill.getLength?.() ?? 0;
        quill.insertEmbed(insertIndex, 'image', imageUrl, 'user');
        quill.setSelection(insertIndex + 1, 0);
      } catch (e: any) {
        console.error('이미지 업로드를 실패했습니다.', e);
        const message = e?.response?.data?.error || e?.response?.data?.message || e?.message;
        alert(message || '이미지 업로드를 실패했습니다.');
      }
    };
    input.click();
  }, [resolveEditorWithRetry, uploadEditorImage]);

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
    const editor = resolveEditor();
    const toolbar = editor?.getModule?.('toolbar');
    if (toolbar?.addHandler) {
      toolbar.addHandler('image', handleImageUpload);
    }
  }, [handleImageUpload, resolveEditor]);

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
