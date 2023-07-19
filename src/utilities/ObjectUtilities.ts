
export default class ObjectUtilities {

    /**
     * Checks two values for deep equality, recursively checking whether all properties equal.
     *
     * All properties are compared without type-coercion (i.e. using ===).
     * Since NaN != NaN, any object containing NaN somewhere does not equal itself.
     */
    static isEqual(lhs: any, rhs: any): boolean {
        // This comparison covers all primitives that we want to consider equal except objects (incl. arrays).
        if (lhs === rhs) { return true; }
        // Both sides are objects
        if (typeof lhs === 'object' && typeof rhs === 'object') {
            // null is of type object, but getOwnPropertyNames crashes on null.
            // If both were null, we would've caught it in the strict equality check.
            if (!lhs || !rhs) { return false; }
            const lhsProperties = Object.getOwnPropertyNames(lhs).sort();
            const rhsProperties = Object.getOwnPropertyNames(rhs).sort();
            // It's assumed that if the properties don't match we're dealing with different types
            if (lhsProperties.length != rhsProperties.length) { return false; }
            // Compare properties
            for (const i in lhsProperties) {
                const lhsName = lhsProperties[i]; const rhsName = rhsProperties[i];
                if (lhsName != rhsName) { return false; }
                const lhsValue = lhs[lhsName]; const rhsValue = rhs[rhsName];
                if (!this.isEqual(lhsValue, rhsValue)) { return false; }
            }
            // All properties match
            return true;
        }
        return false;
    }
}
