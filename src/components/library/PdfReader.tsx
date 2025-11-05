import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfReaderProps {
  fileUrl: string;
}

export const PdfReader: React.FC<PdfReaderProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber < numPages ? pageNumber + 1 : numPages);
  };

  return (
    <div>
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="max-w-full"
      >
        <Page pageNumber={pageNumber} width={700} />
      </Document>
      <div className="flex justify-center items-center mt-4">
        <button
          type="button"
          disabled={pageNumber <= 1}
          onClick={goToPrevPage}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
        >
          Anterior
        </button>
        <p className="mx-4">
          Página {pageNumber || (numPages ? 1 : '--')} de {numPages || '--'}
        </p>
        <button
          type="button"
          disabled={pageNumber >= (numPages || 0)}
          onClick={goToNextPage}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};