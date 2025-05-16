/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TEXT2PPL_AGENT_CONFIG_ID,
  TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID,
  TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID,
} from '../common/constants/llm';
import { DEFAULT_DATA } from '../../../src/plugins/data/common';
import { UiActionsStart } from '../../../src/plugins/ui_actions/public';
import { AssistantServiceStart } from './services/assistant_service';
import { AI_ASSISTANT_QUERY_EDITOR_TRIGGER } from './ui_triggers';
import { CoreStart } from '../../../src/core/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { toMountPoint } from '../../../src/plugins/opensearch_dashboards_react/public';
import { InputPanel } from './components/text_to_dashboard/input_panel';

interface Services {
  core: CoreStart;
  data: DataPublicPluginStart;
  uiActions: UiActionsStart;
  assistantService: AssistantServiceStart;
}

export function registerGenerateDashboardUIAction(services: Services) {
  services.uiActions.addTriggerAction(AI_ASSISTANT_QUERY_EDITOR_TRIGGER, {
    id: 'assistant_generate_dashboard_action',
    order: 10,
    getDisplayName: () => 'Data insights',
    getIconType: () => 'dashboard' as const,
    // T2Viz is only compatible with data sources that have certain agents configured
    isCompatible: async (context) => {
      // t2viz only supports selecting index pattern at the moment
      if (context.datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN && context.datasetId) {
        const res = await services.assistantService.client.agentConfigExists(
          [
            TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID,
            TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID,
            TEXT2PPL_AGENT_CONFIG_ID,
          ],
          {
            dataSourceId: context.dataSourceId,
          }
        );
        return res.exists;
      }
      return false;
    },
    execute: async (context) => {
      if (context.datasetId && context.datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) {
        const indexPattern = await services.data.indexPatterns.get(context.datasetId);
        const flyout = services.core.overlays.openFlyout(
          toMountPoint(
            <InputPanel
              indexPattern={indexPattern}
              dataSourceId={context.dataSourceId}
              core={services.core}
              data={services.data}
              onClose={() => flyout.close()}
            />
          )
        );
        // const url = new URL(
        //   services.core.application.getUrlForApp(TEXT_TO_DASHBOARD_APP_ID, { absolute: true })
        // );
        // if (context.datasetId && context.datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) {
        //   url.searchParams.set('indexPatternId', context.datasetId);
        // }
        // services.core.application.navigateToUrl(url.toString());
      }
    },
  });
}
