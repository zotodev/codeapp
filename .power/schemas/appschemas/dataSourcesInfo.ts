/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "zap_cloudflowcalls": {
    "tableId": "",
    "version": "",
    "primaryKey": "zap_cloudflowcallid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "zap_cloudflowruns": {
    "tableId": "",
    "version": "",
    "primaryKey": "zap_cloudflowrunid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "zap_orders": {
    "tableId": "",
    "version": "",
    "primaryKey": "zap_orderid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "zap_greetapi": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "zap_GreetApi": {
        "path": "/api/data/v9.2/zap_GreetApi",
        "method": "POST",
        "parameters": [
          {
            "name": "zap_name",
            "in": "body",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "zap_testaction": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "zap_TestAction": {
        "path": "/api/data/v9.2/zap_TestAction",
        "method": "POST",
        "parameters": [
          {
            "name": "Input",
            "in": "body",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "getapisubmissiondata": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  }
};
