import React, { useState } from "react";
import { Dropbox } from "dropbox";

const DROPBOX_ACCESS_TOKEN = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN;

// Types pour les props
interface DropboxUploaderProps {
  onSuccess?: (url: string) => void; // Callback appelé quand un URL est disponible
  buttonText?: string; // Texte du bouton personnalisable
  compact?: boolean; // Mode compact pour une intégration plus discrète
}

export default function DropboxUploader({ onSuccess, buttonText = "Uploader sur Dropbox", compact = false }: DropboxUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
    let uploadSuccess = false;
    let uploadPath = "";
    
    try {
      // Étape 1: Upload du fichier
      const response = await dbx.filesUpload({
        path: "/" + encodeURIComponent(file.name),
        contents: file,
        autorename: true,
      });
      
      uploadSuccess = true;
      uploadPath = response.result.path_display || response.result.path_lower || "/" + file.name;
      console.log("Upload réussi!", response);
      
      try {
        // Étape 2: Création du lien partageable
        const linkRes = await dbx.sharingCreateSharedLinkWithSettings({
          path: uploadPath,
        });
        const rawUrl = linkRes.result.url.replace("?dl=0", "?raw=1");
        setUrl(rawUrl);
        
        // Appel du callback onSuccess avec l'URL
        if (onSuccess) {
          onSuccess(rawUrl);
        }
      } catch (shareErr) {
        console.error("Erreur lors de la création du lien partageable:", shareErr);
        // L'upload a fonctionné mais pas le partage
        alert("Le fichier a été uploadé avec succès, mais la création du lien a échoué.");
      }
    } catch (uploadErr) {
      console.error("Erreur lors de l'upload:", uploadErr);
      if (uploadErr instanceof Error) {
        alert(`Erreur lors de l'upload : ${uploadErr.message}\nType: ${uploadErr.constructor.name}`);
      } else {
        alert(`Erreur lors de l'upload : ${String(uploadErr)}`);
      }
    }
    
    setUploading(false);
    
    // Même si l'obtention du lien a échoué, indiquons que l'upload a réussi
    if (uploadSuccess) {
      return alert(`Fichier "${file.name}" uploadé avec succès sur Dropbox!`);
    }
  };

  return (
    <div className={compact ? "flex items-center" : "space-y-3"}>
      <div className={compact ? "flex-grow mr-2" : "mb-2"}>
        <input 
          type="file" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0 file:text-sm file:font-medium
          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className={`${compact ? "" : "w-full"} bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center`}
      >
        {uploading ? "Envoi..." : buttonText}
      </button>
      {url && !compact && (
        <div className="mt-2 text-sm text-gray-600">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Fichier uploadé avec succès
          </a>
        </div>
      )}
    </div>
  );
}