// @ts-check
import * as uuid from "uuid"
import { binaryToDocumentId, stringifyAutomergeUrl } from "@automerge/automerge-repo/dist/DocUrl.js"
import bs58check from "bs58check"

/** @param {string} uuidStr 
 *  @returns {import("@automerge/automerge-repo").AutomergeUrl}
 **/
export function uuidToUrl(uuidStr) {
    /** @type {import("@automerge/automerge-repo").BinaryDocumentId} */
    // @ts-ignore
    const parsed = uuid.parse(uuidStr)
    const id = binaryToDocumentId(parsed)
    const url = stringifyAutomergeUrl({documentId: id})
    return url
}

/** @param {string} docId: base58 encoded docId
 *
 *  @returns {string}
 */
export function base58DocIdToUuid(docId) {
    const bytes = bs58check.decode(docId)
    const uuidStr = uuid.stringify(bytes)
    return uuidStr
}

/** @param {string} uuidStr
 * @returns {string}
 **/
export function uuidToBase58DocId(uuidStr) {
    const bytes = uuid.parse(uuidStr)
    return bs58check.encode(bytes)
}
