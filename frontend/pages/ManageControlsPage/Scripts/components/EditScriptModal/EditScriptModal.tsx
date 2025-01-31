import React, { useCallback, useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";

import { NotificationContext } from "context/notification";
import scriptAPI from "services/entities/scripts";

import Button from "components/buttons/Button";
import CustomLink from "components/CustomLink";
import DataError from "components/DataError";
import Editor from "components/Editor";
import Modal from "components/Modal";
import ModalFooter from "components/ModalFooter";
import Spinner from "components/Spinner";
import paths from "router/paths";

import { getErrorMessage } from "../ScriptUploader/helpers";

const baseClass = "edit-script-modal";

interface IEditScriptModal {
  onCancel: () => void;
  scriptId: number;
  scriptName: string;
}

const EditScriptModal = ({
  scriptId,
  scriptName,
  onCancel,
}: IEditScriptModal) => {
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
    }
  );

  const [submitting, setSubmitting] = useState(false);

  // Editable script content
  const [scriptFormData, setScriptFormData] = useState("");
  useEffect(() => {
    setScriptFormData(scriptContent);
  }, [scriptContent]);

  const onChange = (value: string) => {
    setScriptFormData(value);
  };

  const onUploaded = () => {
    onCancel();
  };

  const onSave = async () => {
    try {
      setSubmitting(true);
      await scriptAPI.updateScript(scriptId, scriptFormData, scriptName);
      renderFlash("success", "Successfully saved script.");
      onUploaded();
    } catch (e) {
      renderFlash("error", getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSave();
    }

  const renderContent = () => {
    if (isLoadingSelectedScriptContent) {
      return <Spinner />;
    }

    if (isSelectedScriptContentError) {
      return <DataError description="Close this modal and try again." />;
    }

    return (
      <>
        <form onSubmit={onSubmit}>
          <Editor value={scriptFormData} onChange={onChange} isFormField />
          <div className="form-field__help-text">
            To run this script on a host, go to the{" "}
            <CustomLink text="Hosts" url={paths.MANAGE_HOSTS} /> page and select
            a host.
            <br />
            To run the script across multiple hosts, add a policy automation on
            the <CustomLink text="Policies" url={paths.MANAGE_POLICIES} /> page.
          </div>
        </form>
        <ModalFooter
          primaryButtons={
            <>
              <Button onClick={onCancel} variant="inverse">
                Cancel
              </Button>
              <Button
                onClick={onSave}
                variant="brand"
                isLoading={submitting}
                disabled={submitting}
              >
                Save
              </Button>
            </>
          }
        />
      </>
    );
  };

  return (
    <Modal
      className={baseClass}
      title={scriptName}
      width="large"
      onExit={onCancel}
    >
      {renderContent()}
    </Modal>
  );
};

export default EditScriptModal;
