import React, { useState, useEffect, useRef } from 'react';
import Epub from 'epubjs';
import { showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';

interface EpubReaderProps {
  fileUrl: string;
}

export const EpubReader: React.FC<EpubReaderProps> = ({ fileUrl }) => {
  const [book, setBook] = useState<any>(null);
  const [rendition, setRendition] = useState<any>(null);
  const [displayed, setDisplayed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const renditionRef = useRef(null);

  useEffect(() => {
    const initBook = async () => {
      try {
        const newBook = Epub(fileUrl);
        setBook(newBook);

        const newRendition = newBook.renderTo(renditionRef.current, {
          width: "100%",
          height: "600px",
          flow: "paginated",
        });
        setRendition(newRendition);

        await newRendition.display();
        setDisplayed(true);
        setLoadError(null);
      } catch (error) {
        console.error("Erro ao carregar EPUB:", error);
        setLoadError("Erro ao carregar o EPUB. Verifique o arquivo ou tente novamente.");
      }
    };

    if (fileUrl && renditionRef.current) {
      initBook();
    }

    return () => {
      if (rendition) {
        rendition.destroy();
      }
      if (book) {
        book.destroy();
      }
    };
  }, [fileUrl]);

  const goToNextPage = () => {
    if (rendition) {
      rendition.next();
    }
  };

  const goToPrevPage = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  return (
    <div className="relative">
      {loadError && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/80 text-red-600 z-10">
          {loadError}
        </div>
      )}
      <div ref={renditionRef} className="w-full" />
      {displayed && (
        <div className="flex justify-center items-center mt-4">
          <Button
            type="button"
            onClick={goToPrevPage}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Anterior
          </Button>
          <Button
            type="button"
            onClick={goToNextPage}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md ml-4"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
};