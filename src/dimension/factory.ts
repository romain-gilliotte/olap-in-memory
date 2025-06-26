import GenericDimension from './generic';
import TimeDimension from './time';
import { fromBuffer } from '../serialization';

type AnyDimension = GenericDimension | TimeDimension;

interface DimensionFactory {
    deserialize(buffer: ArrayBuffer): AnyDimension;
}

const dimensionFactory: DimensionFactory = {
    deserialize(buffer: ArrayBuffer): AnyDimension {
        const data = fromBuffer(buffer) as unknown as { start?: string };
        if (data.start) return TimeDimension.deserialize(buffer);
        else return GenericDimension.deserialize(buffer);
    },
};

export default dimensionFactory;
