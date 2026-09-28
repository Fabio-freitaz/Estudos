import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const validatePdfFile = (file) => {
  if (!file) {
    return 'Envie um arquivo PDF válido.';
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Envie um arquivo PDF válido.';
  }

  if (file.type && !['application/pdf'].includes(file.type)) {
    return 'Envie um arquivo PDF válido.';
  }

  if (file.size === 0) {
    return 'Arquivo vazio. Envie um PDF com conteúdo.';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'Esse arquivo ultrapassa o limite de 10 MB.';
  }

  return null;
};

export const extractTextFromPdf = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');

    if (text.trim()) {
      textParts.push(text.trim());
    }
  }

  const combinedText = textParts.join('\n\n');
  if (!combinedText.trim()) {
    throw new Error('Não conseguimos encontrar texto neste PDF.');
  }

  return combinedText;
};
