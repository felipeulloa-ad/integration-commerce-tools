import * as Joi from 'joi';
import 'dotenv/config';
import _ = require('lodash');
import { Injectable, Logger } from '@nestjs/common';

const logger = new Logger('ConfigService');

const validationSchema = Joi.object({
  debug: Joi.object({
    extensionKey: Joi.string(),
    ngrokEnabled: Joi.boolean(),
  }),
  commercetools: Joi.object({
    projectKey: Joi.string().required(),
    region: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scope: Joi.array<string>(),
  }),
});

const defaultConfiguration = {
  debug: {
    extensionKey: process.env.DEBUG_EXTENSION_KEY || 'dev-debug-extension',
    ngrokEnabled: process.env.NGROK_ENABLED === 'true',
  },
  commercetools: {
    projectKey: process.env.CTP_PROJECT_KEY,
    region: process.env.CTP_REGION,
    clientId: process.env.CTP_CLIENT_ID,
    clientSecret: process.env.CTP_CLIENT_SECRET,
    scope: (process.env.CTP_SCOPE || '').split(' '),
  },
};

export const validateConfiguration = () => {
  const validation = validationSchema.validate(configuration(), {
    abortEarly: false,
    allowUnknown: false,
  });

  if (validation.error) {
    throw validation.error.details;
  }

  return validation;
};

export const configuration = () => {
  if (process.env.CONFIG_OVERRIDE) {
    try {
      const configOverride = JSON.parse(process.env.CONFIG_OVERRIDE);
      const mergedConfig = _.merge(defaultConfiguration, configOverride);
      return mergedConfig;
    } catch (err) {
      logger.error('Failed to apply configuration override. Error: ', err);
      logger.log('Continuing only with default configuration.');
    }
  }

  return defaultConfiguration;
};

// Only intended for scripts or cases where NestJS modules are not available
@Injectable()
export class ScriptConfigService {
  private config;
  constructor() {
    validateConfiguration();
    this.config = configuration();
  }

  public get(propertyPath: string) {
    const splitPath = propertyPath.split('.');
    let resultProp = this.config;
    splitPath.forEach((prop) => {
      resultProp = resultProp[prop];
    });
    return resultProp;
  }
}
