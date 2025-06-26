import GenericDimension = require('./generic');
import TimeDimension = require('./time');
import { fromBuffer } from '../serialization';

type AnyDimension = GenericDimension | TimeDimension;

interface DimensionFactory {
    deserialize(buffer: ArrayBuffer): AnyDimension;
}

const dimensionFactory: DimensionFactory = {
    deserialize(buffer: ArrayBuffer): AnyDimension {
        const data = fromBuffer(buffer) as any;
        if (data.start) return TimeDimension.deserialize(buffer);
        else return GenericDimension.deserialize(buffer);
    },
};

export = dimensionFactory;
