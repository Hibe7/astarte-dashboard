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

import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Spinner, Table } from 'react-bootstrap';
import type { AstarteFlow } from 'astarte-client';

import { AlertsBanner, useAlerts } from './AlertManager';
import Icon from './components/Icon';
import ConfirmModal from './components/modals/Confirm';
import SingleCardPage from './ui/SingleCardPage';
import Empty from './components/Empty';
import WaitForData from './components/WaitForData';
import useFetch from './hooks/useFetch';
import { useAstarte } from './AstarteManager';

interface TableRowProps {
  instance: AstarteFlow;
  onDelete: (instance: AstarteFlow) => void;
}

const TableRow = ({ instance, onDelete }: TableRowProps): React.ReactElement => {
  const astarte = useAstarte();
  return (
    <tr>
      <td>
        <Icon icon="statusConnected" tooltip="Running" tooltipPlacement="right" />
      </td>
      <td>
        {astarte.token?.can('flow', 'GET', `/flows/${instance.name}`) ? (
          <Link to={`/flows/${instance.name}/edit`}>{instance.name}</Link>
        ) : (
          instance.name
        )}
      </td>
      <td>{instance.pipeline}</td>
      <td>
        {astarte.token?.can('flow', 'DELETE', `/flows/${instance.name}`) && (
          <Icon
            icon="delete"
            as="button"
            tooltip="Delete instance"
            tooltipPlacement="left"
            onClick={() => onDelete(instance)}
          />
        )}
      </td>
    </tr>
  );
};

interface InstancesTableProps {
  instances: AstarteFlow[];
  onDelete: (instance: AstarteFlow) => void;
}

const InstancesTable = ({ instances, onDelete }: InstancesTableProps): React.ReactElement => {
  if (instances.length === 0) {
    return <p>No running flows</p>;
  }
  return (
    <Table responsive>
      <thead>
        <tr>
          <th className="status-column">Status</th>
          <th>Flow Name</th>
          <th>Pipeline</th>
          <th className="action-column">Actions</th>
        </tr>
      </thead>
      <tbody>
        {instances.map((instance) => (
          <TableRow key={instance.name} instance={instance} onDelete={onDelete} />
        ))}
      </tbody>
    </Table>
  );
};

export default (): React.ReactElement => {
  const [flowToConfirmDelete, setFlowToConfirmDelete] = useState<AstarteFlow['name'] | null>(null);
  const [isDeletingFlow, setIsDeletingFlow] = useState(false);
  const [deletionAlerts, deletionAlertsController] = useAlerts();
  const navigate = useNavigate();
  const astarte = useAstarte();

  const fetchInstances = useCallback(async (): Promise<AstarteFlow[]> => {
    const instanceNames = await astarte.client.getFlowInstances();
    const instances = await Promise.all(
      instanceNames.map((name) => astarte.client.getFlowDetails(name)),
    );
    return instances;
  }, [astarte.client]);

  const instancesFetcher = useFetch(fetchInstances);

  const handleDeleteFlow = useCallback(
    (instance: AstarteFlow) => {
      setFlowToConfirmDelete(instance.name);
    },
    [setFlowToConfirmDelete],
  );

  const deleteFlow = useCallback(() => {
    const flowName = flowToConfirmDelete as AstarteFlow['name'];
    setIsDeletingFlow(true);
    astarte.client
      .deleteFlowInstance(flowName)
      .then(() => {
        setFlowToConfirmDelete(null);
        setIsDeletingFlow(false);
        instancesFetcher.refresh();
      })
      .catch((err) => {
        setIsDeletingFlow(false);
        deletionAlertsController.showError(`Could not delete flow instance: ${err.message}`);
      });
  }, [
    astarte.client,
    flowToConfirmDelete,
    setFlowToConfirmDelete,
    setIsDeletingFlow,
    instancesFetcher.refresh,
    deletionAlertsController,
  ]);

  const handleModalCancel = useCallback(() => {
    setFlowToConfirmDelete(null);
  }, [setFlowToConfirmDelete]);

  return (
    <SingleCardPage title="Running Flows">
      <AlertsBanner alerts={deletionAlerts} />
      <WaitForData
        data={instancesFetcher.value}
        status={instancesFetcher.status}
        fallback={
          <Container fluid className="text-center">
            <Spinner animation="border" role="status" />
          </Container>
        }
        errorFallback={
          <Empty title="Couldn't load flow instances" onRetry={instancesFetcher.refresh} />
        }
      >
        {(instances) => <InstancesTable instances={instances} onDelete={handleDeleteFlow} />}
      </WaitForData>
      <Button
        variant="primary"
        hidden={!astarte.token?.can('flow', 'GET', '/pipelines')}
        onClick={() => navigate('/pipelines')}
      >
        New flow
      </Button>
      {flowToConfirmDelete != null && (
        <ConfirmModal
          title="Warning"
          confirmLabel="Delete"
          confirmVariant="danger"
          onCancel={handleModalCancel}
          onConfirm={deleteFlow}
          isConfirming={isDeletingFlow}
        >
          <p>
            Delete flow <b>{flowToConfirmDelete}</b>?
          </p>
        </ConfirmModal>
      )}
    </SingleCardPage>
  );
};
