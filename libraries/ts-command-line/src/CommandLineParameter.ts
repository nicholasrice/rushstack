// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  IBaseCommandLineDefinition,
  ICommandLineFlagDefinition,
  ICommandLineStringDefinition,
  ICommandLineStringListDefinition,
  ICommandLineIntegerDefinition,
  ICommandLineChoiceDefinition,
  IBaseCommandLineDefinitionWithArgument
} from './CommandLineDefinition';

/**
 * Identifies the kind of a CommandLineParameter.
 * @public
 */
export enum CommandLineParameterKind {
  /** Indicates a CommandLineChoiceParameter */
  Choice,
  /** Indicates a CommandLineFlagParameter */
  Flag,
  /** Indicates a CommandLineIntegerParameter */
  Integer,
  /** Indicates a CommandLineStringParameter */
  String,
  /** Indicates a CommandLineStringListParameter */
  StringList
}

/**
 * The base class for the various command-line parameter types.
 * @public
 */
export abstract class CommandLineParameter<T> {
  private static _longNameRegExp: RegExp = /^-(-[a-z0-9]+)+$/;
  private static _shortNameRegExp: RegExp = /^-[a-zA-Z0-9]$/;

  /**
   * A unique internal key used to retrieve the value from the parser's dictionary.
   * @internal
   */
  public _parserKey: string;

  /** {@inheritdoc IBaseCommandLineDefinition.parameterLongName} */
  public readonly longName: string;

  /** {@inheritdoc IBaseCommandLineDefinition.parameterShortName} */
  public readonly shortName: string | undefined;

  /** {@inheritdoc IBaseCommandLineDefinition.description} */
  public readonly description: string;

  private _value: T;

  /** @internal */
  constructor(definition: IBaseCommandLineDefinition) {
    if (!CommandLineParameter._longNameRegExp.test(definition.parameterLongName)) {
      throw new Error(`Invalid name: "${definition.parameterLongName}". The parameter long name must be`
        + ` lower-case and use dash delimiters (e.g. "--do-a-thing")`);
    }
    this.longName = definition.parameterLongName;

    if (definition.parameterShortName) {
      if (!CommandLineParameter._shortNameRegExp.test(definition.parameterShortName)) {
        throw new Error(`Invalid name: "${definition.parameterShortName}". The parameter short name must be`
          + ` a dash followed by a single letter (e.g. "-a")`);
      }
    }
    this.shortName = definition.parameterShortName;
    this.description = definition.description;
  }

  /**
   * Called internally by CommandLineParameterProvider._processParsedData()
   * @internal
   */
  public _setValue(data: any): void { // tslint:disable-line:no-any
    this._value = data;
  }

  /**
   * After the command line has been parsed, this returns the value of the parameter.
   * @remarks
   * For example, for a CommandLineFlagParameter it will be a boolean indicating
   * whether the switch was provided.  For a CommandLineStringListParameter it will
   * be an array of strings.
   */
  public get value(): T {
    return this._value;
  }

  /**
   * Indicates the type of parameter.
   */
  public abstract get kind(): CommandLineParameterKind;
}

/**
 * The common base class for parameters types that receive an argument.
 *
 * @remarks
 * An argument is an accompanying command-line token, such as "123" in the
 * example "--max-count 123".
 * @public
 */
export abstract class CommandLineParameterWithArgument<T> extends CommandLineParameter<T> {
  private static _invalidArgumentNameRegExp: RegExp = /[^A-Z_0-9]/;

  /** {@inheritdoc IBaseCommandLineDefinitionWithArgument.argumentName} */
  public readonly argumentName: string | undefined;

  /** @internal */
  constructor(definition: IBaseCommandLineDefinitionWithArgument) {
    super(definition);

    if (definition.argumentName === '') {
      throw new Error('The argument name cannot be an empty string. (For the default name, specify undefined.)');
    }
    if (definition.argumentName.toUpperCase() !== definition.argumentName) {
      throw new Error(`Invalid name: "${definition.argumentName}". The argument name must be all upper case.`);
    }
    const match: RegExpMatchArray | null = definition.argumentName.match(
      CommandLineParameterWithArgument._invalidArgumentNameRegExp);
    if (match) {
      throw new Error(`The argument name "${definition.argumentName}" contains an invalid character "${match[0]}".`
        + ` Only upper-case letters, numbers, and underscores are allowed.`);
    }
    this.argumentName = definition.argumentName;
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineChoiceParameter}.
 * @public
 */
export class CommandLineChoiceParameter extends CommandLineParameter<string> {
  /** {@inheritdoc ICommandLineChoiceDefinition.alternatives} */
  public readonly alternatives: ReadonlyArray<string>;

  /** {@inheritdoc ICommandLineChoiceDefinition.defaultValue} */
  public readonly defaultValue: string | undefined;

  /** @internal */
  constructor(definition: ICommandLineChoiceDefinition) {
    super(definition);

    if (definition.alternatives.length <= 1) {
      throw new Error(`When defining a choice parameter, the alternatives list must contain at least one value.`);
    }
    if (definition.defaultValue && definition.alternatives.indexOf(definition.defaultValue) === -1) {
      throw new Error(`The specified default value "${definition.defaultValue}"`
        + ` is not one of the available options: ${definition.alternatives.toString()}`);
    }

    this.alternatives = definition.alternatives;
    this.defaultValue = definition.defaultValue;
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.Choice;
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineFlagParameter}.
 * @public
 */
export class CommandLineFlagParameter extends CommandLineParameter<boolean> {
  /** @internal */
  constructor(definition: ICommandLineFlagDefinition) {
    super(definition);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.Flag;
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineIntegerParameter}.
 * @public
 */
export class CommandLineIntegerParameter extends CommandLineParameterWithArgument<number> {
  /** @internal */
  constructor(definition: ICommandLineIntegerDefinition) {
    super(definition);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.Integer;
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineStringParameter}.
 * @public
 */
export class CommandLineStringParameter extends CommandLineParameterWithArgument<string> {
  /** @internal */
  constructor(definition: ICommandLineStringDefinition) {
    super(definition);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.String;
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineStringListParameter}.
 * @public
 */
export class CommandLineStringListParameter extends CommandLineParameterWithArgument<string[]> {
  /** @internal */
  constructor(definition: ICommandLineStringListDefinition) {
    super(definition);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.StringList;
  }
}
