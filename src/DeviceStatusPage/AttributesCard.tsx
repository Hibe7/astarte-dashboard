/*
   This file is part of Astarte.

   Copyright 2020 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import React from 'react';
import { Button, Card, Table } from 'react-bootstrap';
import type { AstarteDevice } from 'astarte-client';

import FullHeightCard from '../components/FullHeightCard';
import Icon from '../components/Icon';
import { useAstarte } from 'AstarteManager';

interface AttributeKeyValuePair {
  key: string;
  value: string;
}

interface AttributesTableProps {
  deviceId: string;
  attributes: Map<string, string>;
  onEditAttributeClick: (key: string) => void;
  onRemoveAttributeClick: ({ key, value }: AttributeKeyValuePair) => void;
}

const AttributesTable = ({
  deviceId,
  attributes,
  onEditAttributeClick,
  onRemoveAttributeClick,
}: AttributesTableProps): React.ReactElement => {
  const astarte = useAstarte();
  return (
    <Table responsive>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th className="action-column">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from(attributes.entries()).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
            <td className="text-center">
              {astarte.token?.can('appEngine', 'PATCH', `/devices/${deviceId}`) && (
                <Icon
                  icon="edit"
                  className="color-grey me-2"
                  onClick={() => onEditAttributeClick(key)}
                />
              )}
              {astarte.token?.can('appEngine', 'PATCH', `/devices/${deviceId}`) && (
                <Icon icon="erase" onClick={() => onRemoveAttributeClick({ key, value })} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

interface AttributesCardProps {
  device: AstarteDevice;
  onNewAttributeClick: () => void;
  onEditAttributeClick: (key: string) => void;
  onRemoveAttributeClick: ({ key, value }: AttributeKeyValuePair) => void;
}

const AttributesCard = ({
  device,
  onNewAttributeClick,
  onEditAttributeClick,
  onRemoveAttributeClick,
}: AttributesCardProps): React.ReactElement => {
  const astarte = useAstarte();
  return (
    <FullHeightCard xs={12} md={6} className="mb-4">
      <Card.Header as="h5">Attributes</Card.Header>
      <Card.Body className="d-flex flex-column">
        {device.attributes.size > 0 ? (
          <AttributesTable
            deviceId={device.id}
            attributes={device.attributes}
            onEditAttributeClick={onEditAttributeClick}
            onRemoveAttributeClick={onRemoveAttributeClick}
          />
        ) : (
          <p>Device has no attribute</p>
        )}
        <div className="mt-auto">
          <Button
            variant="primary"
            onClick={onNewAttributeClick}
            hidden={!astarte.token?.can('appEngine', 'PATCH', `/devices/${device.id}`)}
            disabled={device.deletionInProgress}
          >
            Add attribute
          </Button>
        </div>
      </Card.Body>
    </FullHeightCard>
  );
};

export default AttributesCard;
