import React from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import {
  Application,
  Archetype,
  Assessment,
  Questionnaire,
} from "@app/api/models";
import DynamicAssessmentActionsRow from "./dynamic-assessment-actions-row";

interface QuestionnairesTableProps {
  tableName: string;
  isFetching: boolean;
  isReadonly?: boolean;
  application?: Application;
  archetype?: Archetype;
  assessments?: Assessment[];
  questionnaires?: Questionnaire[];
}

const QuestionnairesTable: React.FC<QuestionnairesTableProps> = ({
  assessments,
  questionnaires,
  isReadonly,
  application,
  archetype,
  tableName,
}) => {
  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: questionnaires || [],
    columnNames: {
      questionnaires: tableName,
    },
    hasActionsColumn: false,
    hasPagination: false,
    variant: "compact",
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: { tableProps, getThProps, getTdProps },
  } = tableControls;
  return (
    <>
      <Table
        {...tableProps}
        aria-label={`Questionnaire table for assessment actions`}
        style={{ background: "none" }}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "questionnaires" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={questionnaires?.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="No Questionnaires are currently available to be taken. " />
            </div>
          }
        >
          <Tbody>
            {currentPageItems?.map((questionnaire, rowIndex) => {
              const matchingArchetypeAssessment = assessments?.find(
                (assessment) =>
                  assessment.questionnaire.id === questionnaire.id &&
                  assessment?.archetype?.id === archetype?.id
              );

              const matchingApplicationAssessment = assessments?.find(
                (assessment) =>
                  assessment.questionnaire.id === questionnaire.id &&
                  assessment?.application?.id === application?.id
              );

              return (
                <Tr key={questionnaire.name}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={questionnaire}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={20}
                      {...getTdProps({ columnKey: "questionnaires" })}
                    >
                      {questionnaire.name}
                    </Td>
                    {application || archetype ? (
                      <DynamicAssessmentActionsRow
                        assessment={
                          archetype
                            ? matchingArchetypeAssessment
                            : matchingApplicationAssessment
                        }
                        questionnaire={questionnaire}
                        application={application}
                        archetype={archetype}
                        isReadonly={isReadonly}
                      />
                    ) : null}
                  </TableRowContentWithControls>
                </Tr>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};

export default QuestionnairesTable;
