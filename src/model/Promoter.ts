import { PromoterElement } from './PromoterElement';

/**
 * Represents a gene promoter containing multiple regulatory elements.
 * A promoter is a DNA region that initiates transcription of a gene.
 */
export class Promoter {
    /** Array of promoter elements that comprise this promoter */
    readonly elements: readonly PromoterElement[];

    /** Position of the transcription start site (TSS) in the genomic sequence */
    readonly transcriptionStartSite: number;

    /** Optional name/identifier for this promoter */
    readonly name?: string;

    /**
     * Creates a new Promoter.
     *
     * @param transcriptionStartSite - Position of TSS in genomic coordinates
     * @param elements - Array of PromoterElements that define this promoter
     * @param name - Optional name for this promoter
     *
     * @example
     * ```typescript
     * const promoter = new Promoter(
     *     1000, // TSS at position 1000
     *     [tataBox, initiatorElement],
     *     "beta-globin-promoter"
     * );
     * ```
     */
    constructor(transcriptionStartSite: number, elements: PromoterElement[], name?: string) {
        this.transcriptionStartSite = transcriptionStartSite;
        this.elements = Object.freeze([...elements]);
        this.name = name;
    }

    /**
     * Gets all elements of a specific type from this promoter.
     * @param elementName - Name of the element type to find (e.g., "TATA", "Inr")
     * @returns Array of matching PromoterElements
     */
    getElementsByName(elementName: string): PromoterElement[] {
        return this.elements.filter(element => element.name === elementName);
    }

    /**
     * Checks if this promoter contains a specific type of element.
     * @param elementName - Name of the element type to check for
     * @returns true if promoter contains at least one element of this type
     */
    hasElement(elementName: string): boolean {
        return this.elements.some(element => element.name === elementName);
    }

    /**
     * Gets the genomic position of a promoter element.
     * @param element - The PromoterElement to locate
     * @returns Genomic position of the element (TSS + element.position)
     */
    getElementPosition(element: PromoterElement): number {
        return this.transcriptionStartSite + element.position;
    }

    /**
     * Gets all promoter elements sorted by their genomic position.
     * @returns Array of elements sorted from upstream to downstream
     */
    getElementsByPosition(): PromoterElement[] {
        return [...this.elements].sort((a, b) => a.position - b.position);
    }

    /**
     * Calculates a strength score for this promoter based on its elements.
     * This is a simplified scoring system - real promoter strength depends on many factors.
     * @returns Numeric score representing promoter strength (higher = stronger)
     */
    getStrengthScore(): number {
        let score = 0;

        // Add points for key elements (simplified scoring)
        if (this.hasElement('TATA')) score += 10;
        if (this.hasElement('Inr')) score += 8;
        if (this.hasElement('DPE')) score += 6;
        if (this.hasElement('CAAT')) score += 5;
        if (this.hasElement('GC')) score += 4;

        // Bonus for multiple elements (synergy)
        if (this.elements.length > 1) {
            score += this.elements.length * 2;
        }

        return score;
    }

    /**
     * Gets a string representation of this promoter.
     * @returns String describing the promoter and its elements
     */
    toString(): string {
        const elementNames = this.elements.map(e => e.name).join(', ');
        const nameStr = this.name ? ` (${this.name})` : '';
        return `Promoter${nameStr} at TSS=${this.transcriptionStartSite} with elements: [${elementNames}]`;
    }
}