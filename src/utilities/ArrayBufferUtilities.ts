export default class ArrayBufferUtilities {
    
    static toBase64(arrayBuffer: ArrayBuffer): string {
        var binary = '';
        var bytes = new Uint8Array(arrayBuffer);
        var count = bytes.byteLength;
        for (var i = 0; i < count; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}