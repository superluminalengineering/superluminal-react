export default class ArrayBufferUtilities {
    
    static toBase64(arrayBuffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const count = bytes.byteLength;
        for (let i = 0; i < count; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}