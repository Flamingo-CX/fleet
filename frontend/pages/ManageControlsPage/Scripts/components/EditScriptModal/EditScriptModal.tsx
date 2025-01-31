import { format } from "date-fns";
import FileSaver from "file-saver";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  QueryObserverResult,
  RefetchOptions,
  RefetchQueryFilters,
  useQuery,
} from "react-query";

import { AppContext } from "context/app";
import { NotificationContext } from "context/notification";
import { IApiError, getErrorReason } from "interfaces/errors";
import { IHostScript } from "interfaces/script";
import scriptAPI, { IHostScriptsResponse } from "services/entities/scripts";

import ActionsDropdown from "components/ActionsDropdown";
import Button from "components/buttons/Button";
import CustomLink from "components/CustomLink";
import DataError from "components/DataError";
import Editor from "components/Editor";
import Icon from "components/Icon";
import Modal from "components/Modal";
import ModalFooter from "components/ModalFooter";
import Spinner from "components/Spinner";
import Textarea from "components/Textarea";
import { generateActionDropdownOptions } from "pages/hosts/details/HostDetailsPage/modals/RunScriptModal/ScriptsTableConfig";
import paths from "router/paths";

const baseClass = "edit-script-modal";

interface IEditScriptModal {
  onCancel: () => void;
  scriptId: number;
  scriptName: string;
  isHidden?: boolean;
  refetchHostScripts?: <TPageData>(
    options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined,
  ) => Promise<QueryObserverResult<IHostScriptsResponse, IApiError>>;
}

const EditScriptModal = ({ scriptId, scriptName, onCancel, isHidden, refetchHostScripts }: IEditScriptModal) => {
  // For scrollable modal
  const [isTopScrolling, setIsTopScrolling] = useState(false);
  const topDivRef = useRef<HTMLDivElement>(null);
  const checkScroll = () => {
    if (topDivRef.current) {
      const isScrolling =
        topDivRef.current.scrollHeight > topDivRef.current.clientHeight;
      setIsTopScrolling(isScrolling);
    }
  };

  const { renderFlash } = useContext(NotificationContext);

  const {
    data: scriptContent,
    error: isSelectedScriptContentError,
    isLoading: isLoadingSelectedScriptContent,
  } = useQuery<any, Error>(
    [scriptId],
    () => scriptAPI.downloadScript(scriptId),
    {
      refetchOnWindowFocus: false,
    },
  );

  // Editable script content
  const [scriptFormData, setScriptFormData] = useState("");
  useEffect(() => {
    setScriptFormData(scriptContent)
  }, [scriptContent]);

  // For scrollable modal
  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [scriptContent, scriptFormData]); // Re-run when data changes

  const handleOnChange = (value: string) => {
    setScriptFormData(value);
  }

  const onUpload = () => {
    onCancel();
  }

  const handleOnSave = async () => {
    try {
      await scriptAPI.updateScript(scriptId, scriptFormData, scriptName)
      renderFlash("success", "Script updated!");
      onUpload();
    } catch (e) {
      renderFlash("error", getErrorReason(e));
    }
  }

  return (
    <Modal
      className={baseClass}
      title={scriptName}
      width="large"
      onExit={onCancel}
      isHidden={isHidden}
    >
      <>
        <form>
          <Editor value={scriptFormData} onChange={handleOnChange}></Editor>
        </form>
        <div className="form-field__help-text">
          To run this script on a host, go to the{" "}
          <CustomLink text="Hosts" url={paths.MANAGE_HOSTS} /> page and select
          a host.
          <br />
          To run the script across multiple hosts, add a policy automation on
          the <CustomLink text="Policies" url={paths.MANAGE_POLICIES} /> page.
        </div>
        <ModalFooter
          isTopScrolling={isTopScrolling}
          secondaryButtons={
            <Button onClick={onCancel}>
              Cancel
            </Button>
          }
          primaryButtons={
            <Button onClick={handleOnSave} variant="brand">
              Save
            </Button>
          }
        />
      </>
    </Modal>
  )
};

export default EditScriptModal;
