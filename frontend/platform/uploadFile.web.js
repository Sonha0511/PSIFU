export async function appendUploadFile(form,asset) {
  // Browser File objects differ from expo-file-system's native File constructor.
  const file=asset.file || await (await fetch(asset.uri)).blob();
  form.append('file',file,asset.name||asset.fileName||'upload.jpg');
}
