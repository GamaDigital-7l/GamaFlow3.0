import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfReaderProps {
  fileUrl: string;
}

export const PdfReader: React.FC<PdfReaderProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoadError(null); // Limpa qualquer erro anterior
  };

  const onDocumentLoadError = (error: any) => {
    console.error("Erro ao carregar PDF:", error);
    setLoadError("Erro ao carregar o PDF. Verifique o arquivo ou tente novamente.");
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber < numPages ? pageNumber + 1 : numPages);
  };

  return (
    <div className="relative">
      {loadError && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/80 text-red-600 z-10">
          {loadError}
        </div>
      )}
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="max-w-full"
      >
        <Page pageNumber={pageNumber} width={700} />
      </Document>
      <div className="flex justify-center items-center mt-4">
        <Button
          variant="outline"
          disabled={pageNumber <= 1 || loadError}
          onClick={goToPrevPage}
          className="px-4 py-2"
        >
          Anterior
        </Button>
        <p className="mx-4">
          Página {pageNumber || (numPages ? 1 : '--')} de {numPages || '--'}
        </p>
        <Button
          variant="outline"
          disabled={pageNumber >= (numPages || 0) || loadError}
          onClick={goToNextPage}
          className="px-4 py-2"
        >
          Próximo
        </Button>
      </div>
    </div>
  );
};