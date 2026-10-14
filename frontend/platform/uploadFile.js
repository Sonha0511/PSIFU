import { File } from 'expo-file-system';
export async function appendUploadFile(form,asset) { form.append('file',new File(asset.uri)); }
