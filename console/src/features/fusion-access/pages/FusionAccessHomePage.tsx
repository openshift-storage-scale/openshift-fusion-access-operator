import { Redirect } from "react-router";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";

const FusionAccessHomePage: React.FC = () => {
  const [storageClusters] = useWatchSpectrumScaleCluster({
    isList: true,
    limit: 1,
  });

  return storageClusters.length === 0 ? (
    <Redirect to="/fusion-access/storage-cluster" />
  ) : (
    <Redirect to="/fusion-access/file-systems" />
  );
};
FusionAccessHomePage.displayName = "FusionAccessHomePage";

export default FusionAccessHomePage;
