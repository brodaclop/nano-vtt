export const random = () => {
    const a = new Uint32Array(1);
    self.crypto.getRandomValues(a);
    return a[0];
}