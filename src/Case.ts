import { camelCase, flow, snakeCase, upperFirst } from 'lodash';

import { Enum } from './client/interfaces/Enum';
import { Model } from './client/interfaces/Model';
import { OperationResponse } from './client/interfaces/OperationResponse';
import { Service } from './client/interfaces/Service';

export enum Case {
    NONE = 'none',
    CAMEL = 'camel',
    SNAKE = 'snake',
    PASCAL = 'pascal',
}

export const pascalCase = flow(camelCase, upperFirst);

const isMultipleWords = (str: string) => Boolean(str.match(/[\s_-]|[a-z][A-Z0-9]/g));

const camelCaseForMultipleWords = (str: string) => (isMultipleWords(str) ? camelCase(str) : str);
const snakeCaseForMultipleWords = (str: string) => (isMultipleWords(str) ? snakeCase(str) : str);

const transforms = {
    [Case.CAMEL]: camelCaseForMultipleWords,
    [Case.SNAKE]: snakeCaseForMultipleWords,
    [Case.PASCAL]: pascalCase,
};

// A recursive function that looks at the models and their properties and
// converts each property name using the provided transform function.
export const convertModelNames = <T extends Model | OperationResponse>(model: T, type: Exclude<Case, Case.NONE>): T => {
    // if (model.export === 'array') console.log(model);
    return {
        ...model,
        name: model.export === 'interface' ? model.name : transforms[type](model.name),
        link: model.link ? convertModelNames(model.link, type) : null,
        enum: model.enum.map(modelEnum => convertEnumName(modelEnum, type)),
        enums: model.enums.map(property => convertModelNames(property, type)),
        properties: model.properties.map(property => convertModelNames(property, type)),
    };
};

const convertEnumName = (modelEnum: Enum, type: Exclude<Case, Case.NONE>): Enum => {
    return {
        ...modelEnum,
        name: transforms[type](modelEnum.name),
    };
};

export const convertServiceCase = (service: Service, type: Exclude<Case, Case.NONE>): Service => {
    return {
        ...service,
        operations: service.operations.map(op => ({
            ...op,
            results: op.results.map(results => convertModelNames(results, type)),
        })),
    };
};
