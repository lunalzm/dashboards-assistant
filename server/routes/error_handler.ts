/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { errors } from '@opensearch-project/opensearch';
import { Logger, OpenSearchDashboardsResponseFactory } from '../../../../src/core/server';
import { AgentNotFoundError } from './errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleError = (e: any, res: OpenSearchDashboardsResponseFactory, logger: Logger) => {
  logger.error('Error occurred', e.body || e.message);
  // Handle specific type of Errors
  if (e instanceof AgentNotFoundError) {
    return res.notFound({ body: 'Agent not found' });
  }

  // handle OpenSearch client connection errors
  if (e instanceof errors.NoLivingConnectionsError || e instanceof errors.ConnectionError) {
    return res.customError({
      body: e.message,
      statusCode: 400,
    });
  }

  // handle http response error of calling backend API
  if (e.statusCode) {
    if (e.statusCode >= 400 && e.statusCode <= 499) {
      let message = typeof e.body === 'string' ? e.body : JSON.stringify(e.body);
      if (!message) {
        message = e.message;
      }
      return res.customError({
        body: { message: message || 'unknown error' },
        statusCode: e.statusCode,
      });
    } else {
      return res.customError({
        statusCode: e.statusCode,
      });
    }
  }

  // Return an general internalError for unhandled server-side issues
  return res.internalError();
};
