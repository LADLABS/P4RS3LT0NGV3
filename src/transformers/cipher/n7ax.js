// N7AX cipher — Polybius + columnar transposition (ADFGX-style with N7AX coordinates)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'N7AX Cipher',
    priority: 60,
    category: 'cipher',
    key: 'N7AX',
    configurableOptions: [
        {
            id: 'key',
            label: 'Transposition keyword',
            type: 'text',
            default: 'N7AX'
        }
    ],
    _transKey: function(options) {
        const k = options && options.key !== undefined && options.key !== null
            ? String(options.key)
            : null;
        return (k || this.key || 'N7AX').toUpperCase().replace(/[^A-Z0-9]/g, '');
    },
    square: [
        ['A', 'B', 'C', 'D', 'E'],
        ['F', 'G', 'H', 'I', 'K'],
        ['L', 'M', 'N', 'O', 'P'],
        ['Q', 'R', 'S', 'T', 'U'],
        ['V', 'W', 'X', 'Y', 'Z']
    ],
    coords: ['N', '7', 'A', 'X', '5'],
    _toCoordText: function(text) {
        let result = '';
        for (const char of text) {
            let found = false;
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (this.square[row][col] === char || (char === 'J' && this.square[row][col] === 'I')) {
                        result += this.coords[row] + this.coords[col];
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
        }
        return result;
    },
    _transposeEncode: function(text, transKey) {
        const keyLength = transKey.length;
        const numCols = keyLength;
        const numRows = Math.ceil(text.length / numCols);
        const grid = [];
        let textIdx = 0;

        for (let row = 0; row < numRows; row++) {
            grid[row] = [];
            for (let col = 0; col < numCols; col++) {
                grid[row][col] = textIdx < text.length ? text[textIdx++] : '';
            }
        }

        const keyOrder = [];
        for (let i = 0; i < transKey.length; i++) {
            keyOrder.push({ char: transKey[i], index: i });
        }
        keyOrder.sort((a, b) => {
            if (a.char < b.char) return -1;
            if (a.char > b.char) return 1;
            return a.index - b.index;
        });

        let result = '';
        for (const keyItem of keyOrder) {
            const col = keyItem.index;
            for (let row = 0; row < numRows; row++) {
                if (grid[row][col]) {
                    result += grid[row][col];
                }
            }
        }
        return result;
    },
    _transposeDecode: function(text, transKey) {
        const keyLength = transKey.length;
        const numCols = keyLength;
        const numRows = Math.ceil(text.length / numCols);
        const keyOrder = [];

        for (let i = 0; i < transKey.length; i++) {
            keyOrder.push({ char: transKey[i], index: i });
        }
        keyOrder.sort((a, b) => {
            if (a.char < b.char) return -1;
            if (a.char > b.char) return 1;
            return a.index - b.index;
        });

        const grid = [];
        for (let row = 0; row < numRows; row++) {
            grid[row] = new Array(numCols);
        }

        let textIdx = 0;
        for (const keyItem of keyOrder) {
            const col = keyItem.index;
            const colLength = Math.ceil((text.length - col) / numCols);
            for (let row = 0; row < colLength && textIdx < text.length; row++) {
                grid[row][col] = text[textIdx++];
            }
        }

        let result = '';
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                if (grid[row] && grid[row][col]) {
                    result += grid[row][col];
                }
            }
        }
        return result;
    },
    _fromCoordText: function(text) {
        let result = '';
        for (let i = 0; i < text.length; i += 2) {
            if (i + 1 >= text.length) {
                break;
            }
            const row = this.coords.indexOf(text[i]);
            const col = this.coords.indexOf(text[i + 1]);
            if (row >= 0 && row < 5 && col >= 0 && col < 5) {
                result += this.square[row][col];
            }
        }
        return result;
    },
    func: function(text, options) {
        options = options || {};
        const transKey = this._transKey(options);
        if (transKey.length === 0) {
            return text;
        }

        const cleaned = text.toUpperCase().replace(/[^A-Z]/g, '');
        if (cleaned.length === 0) {
            return text;
        }

        const coordText = this._toCoordText(cleaned);
        return this._transposeEncode(coordText, transKey);
    },
    reverse: function(text, options) {
        options = options || {};
        const transKey = this._transKey(options);
        if (transKey.length === 0) {
            return text;
        }

        const cleaned = text.toUpperCase().replace(/[^N7AX5]/g, '');
        if (cleaned.length === 0 || cleaned.length % 2 !== 0) {
            return text;
        }

        const coordText = this._transposeDecode(cleaned, transKey);
        return this._fromCoordText(coordText);
    },
    preview: function(text, options) {
        if (!text) {
            return '[n7ax]';
        }
        const result = this.func(text.slice(0, 5), options);
        return result.substring(0, 12) + (result.length > 12 ? '...' : '');
    },
    detector: function(text) {
        const cleaned = text.replace(/[\s]/g, '').toUpperCase();
        if (cleaned.length < 10) {
            return false;
        }
        if (!/^[N7AX5]+$/.test(cleaned)) {
            return false;
        }
        return cleaned.length % 2 === 0;
    }
});
