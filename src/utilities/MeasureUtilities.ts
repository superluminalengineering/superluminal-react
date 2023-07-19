
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d')!;

export default class MeasureUtilities {

    static measureText(text: string, font: string): TextMetrics {
        if (context.font != font) {
            context.font = font;
        }
        return context.measureText(text);
    }

    static measureRegularText(text: string, pointSize: number): TextMetrics {
        return this.measureText(text, `${pointSize}pt Inter, Arial, sans-serif`);
    }

    static measureSemiBoldText(text: string, pointSize: number): TextMetrics {
        return this.measureText(text, `${pointSize}pt Inter-SemiBold, Arial, sans-serif`);
    }

    static measureBoldText(text: string, pointSize: number): TextMetrics {
        return this.measureText(text, `${pointSize}pt Inter-Bold, Arial, sans-serif`);
    }
}
