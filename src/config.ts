import type { Config } from "@canva/app-components";
import { useIntl } from "react-intl";

type ContainerTypes = "collection";
export const useConfig = (): Config<ContainerTypes> => {
  const intl = useIntl();
  return {
    serviceName: intl.formatMessage({
      defaultMessage: "Supabase Images",
      description:
        "Name of the service where the app will pull digital assets from",
    }),
    search: {
      enabled: false,
    },
    containerTypes: [
      {
        value: "collection",
        label: intl.formatMessage({
          defaultMessage: "Collections",
          description: "Name of the asset container type",
        }),
        listingSurfaces: [
          { surface: "HOMEPAGE" },
        ],
        searchInsideContainer: {
          enabled: false,
        },
      },
    ],
    sortOptions: [
      {
        value: "created_at DESC",
        label: intl.formatMessage({
          defaultMessage: "Creation date (newest)",
          description: "One of the sort options",
        }),
      },
      {
        value: "created_at ASC",
        label: intl.formatMessage({
          defaultMessage: "Creation date (oldest)",
          description: "One of the sort options",
        }),
      },
      {
        value: "updated_at DESC",
        label: intl.formatMessage({
          defaultMessage: "Updated (newest)",
          description: "One of the sort options",
        }),
      },
      {
        value: "updated_at ASC",
        label: intl.formatMessage({
          defaultMessage: "Updated (oldest)",
          description: "One of the sort options",
        }),
      },
      {
        value: "name ASC",
        label: intl.formatMessage({
          defaultMessage: "Name (A-Z)",
          description: "One of the sort options",
        }),
      },
      {
        value: "name DESC",
        label: intl.formatMessage({
          defaultMessage: "Name (Z-A)",
          description: "One of the sort options",
        }),
      },
    ],
    layouts: ["MASONRY", "LIST"],
    moreInfoMessage: intl.formatMessage({
      defaultMessage:
        "Images are loaded from your Supabase backend. Corrupted and unsupported files will not appear.",
      description: "Helper text to explain why some assets are not visible",
    }),
  };
};
