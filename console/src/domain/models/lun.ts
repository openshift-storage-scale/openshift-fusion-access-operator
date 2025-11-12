export interface Lun {
  isSelected: boolean;
  nodeName: string;
  path: string;
  wwn: string;
  /**
   * The capacity of the LUN, expressed as a string in GiB units.
   * Note: The value is obtained by calling lsblk, which returns sizes in GiB by default.
   */
  capacity: string;
}
