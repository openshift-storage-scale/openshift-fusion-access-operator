import { Button } from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import { useRoutesUseCase } from "@/domain/use-cases/use_routes_use_case";

export const FileSystemsDashboardLink: React.FC<{
  fileSystemName: string;
}> = ({ fileSystemName }) => {
  const { routes, loaded } = useRoutesUseCase();

  if (!loaded || !routes.length) {
    return <span className="text-secondary">{VALUE_NOT_AVAILABLE}</span>;
  }

  const { host } = routes[0].spec;

  return (
    <Button
      component="a"
      variant="link"
      target="_blank"
      rel="noopener noreferrer"
      href={`https://${host}/gui#files-filesystems-/${fileSystemName}`}
      icon={<ExternalLinkAltIcon />}
      iconPosition="end"
      isInline
    />
  );
};
FileSystemsDashboardLink.displayName = "GpfsDashboardLink";
