import crypto from "crypto"

const PEPPER = process.env.PEPPER || ""

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(12).toString("hex")
    const hashedPassword = crypto
        .createHash("sha256")
        .update(salt + password + PEPPER)
        .digest("hex")
    return salt + hashedPassword
}

export function checkPassword(
    password: string,
    storedHash: string
): boolean {

    // salt = primi 24 caratteri
    const salt = storedHash.substring(0, 24)

    // hash SHA256
    const hashedPassword = crypto
        .createHash("sha256")
        .update(salt + password + PEPPER)
        .digest("hex")

    // confronto finale
    return storedHash === salt + hashedPassword
}
