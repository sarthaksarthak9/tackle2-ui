import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

import { Application, ApplicationDependency, MimeType } from "@app/api/models";
import {
  APPLICATIONS,
  createApplication,
  createApplicationDependency,
  deleteApplication,
  deleteApplicationDependency,
  deleteBulkApplications,
  getApplicationById,
  getApplicationDependencies,
  getApplications,
  updateAllApplications,
  updateApplication,
} from "@app/api/rest";
import { reviewsQueryKey } from "./reviews";
import { assessmentsQueryKey } from "./assessments";
import saveAs from "file-saver";

export const ApplicationDependencyQueryKey = "applicationdependencies";
export const ApplicationsQueryKey = "applications";
export const ReportQueryKey = "report";

interface DownloadOptions {
  application: Application;
  mimeType: MimeType;
}

export const useFetchApplications = () => {
  const queryClient = useQueryClient();
  const { isLoading, error, refetch, data } = useQuery({
    initialData: [],
    queryKey: [ApplicationsQueryKey],
    queryFn: getApplications,
    refetchInterval: 5000,
    onSuccess: () => {
      queryClient.invalidateQueries([reviewsQueryKey]);
      queryClient.invalidateQueries([assessmentsQueryKey]);
    },
    onError: (error: AxiosError) => console.log(error),
  });
  return {
    data: data || [],
    isFetching: isLoading,
    error,
    refetch,
  };
};

export const ApplicationQueryKey = "application";

export const useFetchApplicationById = (id?: number | string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [ApplicationQueryKey, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getApplicationById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
  });

  return {
    application: data,
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useUpdateApplicationMutation = (
  onSuccess: (payload: Application) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (_res, payload) => {
      onSuccess(payload);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useUpdateAllApplicationsMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAllApplications,
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useCreateApplicationMutation = (
  onSuccess: (data: Application) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: ({ data }) => {
      onSuccess(data);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useDeleteApplicationMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(({ id }: { id: number }) => deleteApplication(id), {
    onSuccess: (res) => {
      onSuccess(1);
      queryClient.invalidateQueries([ApplicationsQueryKey]);
    },
    onError: onError,
  });
};

export const useBulkDeleteApplicationMutation = (
  onSuccess: (numberOfApps: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ ids }: { ids: number[] }) => deleteBulkApplications(ids),
    {
      onSuccess: (res, vars) => {
        onSuccess(vars.ids.length);
        queryClient.invalidateQueries([ApplicationsQueryKey]);
      },
      onError: onError,
    }
  );
};

export const downloadStaticReport = async ({
  application,
  mimeType,
}: DownloadOptions): Promise<void> => {
  const yamlAcceptHeader = "application/x-yaml";
  let url = `${APPLICATIONS}/${application.id}/analysis/report`;

  switch (mimeType) {
    case MimeType.YAML:
      url = `${APPLICATIONS}/${application.id}/analysis`;
      break;
    case MimeType.TAR:
    default:
      url = `${APPLICATIONS}/${application.id}/analysis/report`;
  }

  try {
    const response = await axios.get(url, {
      responseType: "blob",
      ...(MimeType.YAML && {
        headers: {
          Accept: yamlAcceptHeader,
        },
      }),
    });

    if (response.status !== 200) {
      throw new Error("Network response was not ok when downloading file.");
    }

    const blob = new Blob([response.data]);
    saveAs(blob, `analysis-report-app-${application.name}.${mimeType}`);
  } catch (error) {
    console.error("There was an error downloading the file:", error);
    throw error;
  }
};

export const useDownloadStaticReport = () => {
  return useMutation(downloadStaticReport);
};

export const useFetchApplicationDependencies = (
  applicationId?: string | number
) => {
  const {
    data: northData,
    error: northError,
    isLoading: isLoadingNorth,
    refetch: refetchNorth,
  } = useQuery<ApplicationDependency[], AxiosError>(
    [ApplicationDependencyQueryKey, "north"],
    () => getApplicationDependencies({ to: [`${applicationId}`] }),
    {
      enabled: !!applicationId,
    }
  );

  const {
    data: southData,
    error: southError,
    isLoading: isLoadingSouth,
    refetch: refetchSouth,
  } = useQuery<ApplicationDependency[], AxiosError>(
    [ApplicationDependencyQueryKey, "south"],
    () => getApplicationDependencies({ from: [`${applicationId}`] })
  );

  const isFetching = isLoadingNorth || isLoadingSouth;
  const fetchError = northError || southError;

  // Combining both refetch functions into a single one.
  const refetch = () => {
    refetchNorth();
    refetchSouth();
  };

  return {
    northboundDependencies: northData,
    southboundDependencies: southData,
    allDependencies: [...(northData || []), ...(southData || [])],
    isFetching,
    fetchError,
    refetch,
  };
};

interface UseCreateApplicationDependencyOptions {
  onError?: (error: AxiosError) => void;
  onSuccess?: () => void;
}

export const useCreateApplicationDependency = ({
  onError,
  onSuccess,
}: UseCreateApplicationDependencyOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation(createApplicationDependency, {
    onSuccess: () => {
      queryClient.invalidateQueries([ApplicationDependencyQueryKey]);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: AxiosError) => {
      if (onError) {
        onError(error);
      }
    },
  });
};

export const useDeleteApplicationDependency = () => {
  const queryClient = useQueryClient();

  return useMutation(deleteApplicationDependency, {
    onSuccess: () => {
      queryClient.invalidateQueries([ApplicationDependencyQueryKey]);
    },
  });
};
