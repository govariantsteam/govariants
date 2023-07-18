export function isDefined<T>(object: T | null | undefined): boolean {
    return object !== null && object !== undefined;
}