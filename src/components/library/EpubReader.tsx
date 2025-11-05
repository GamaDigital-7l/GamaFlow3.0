import React, { useState, useEffect, useRef } from 'react';
import Epub from 'epubjs';

interface EpubReaderProps {
  fileUrl: string;
}

export const EpubReader: React.FC<EpubReaderProps> = ({ fileUrl }) => {
  const [book, setBook] = useState<any>(null);
  const [rendition, setRendition] = useState<any>(null);
  const [displayed, setDisplayed] = useState(false);
  const renditionRef = useRef(null);

  useEffect(() => {
    const initBook = async () => {
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
    <div>
      <div ref={renditionRef} className="w-full" />
      {displayed && (
        <div className="flex justify-center items-center mt-4">
          <button
            type="button"
            onClick={goToPrevPage}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={goToNextPage}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md ml-4"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
};