"use client";

import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getModels } from "../api/getModels";
import { getProfiles } from "../api/getProfiles";
import { SessionContext } from "../components/contexts/SessionContext";
import { ModelProvider } from "../types/objects";
import { Profile } from "../types/profiles";
import { getTenantId, setTenantId, getSelectedProfileId, setSelectedProfileId } from "../lib/vsmFetch";

// Custom hooks
import { useConfigState } from "../components/configuration/hooks/useConfigState";
import { useConfigValidation } from "../components/configuration/hooks/useConfigValidation";
import { useApiKeyManagement } from "../components/configuration/hooks/useApiKeyManagement";

// Components
import ConfigSidebar, {
  DesktopConfigSidebar,
} from "../components/configuration/ConfigSidebar";
import ConfigNameEditor from "../components/configuration/ConfigNameEditor";
import ConfigActions from "../components/configuration/ConfigActions";
import WeaviateSection from "../components/configuration/sections/WeaviateSection";
import StorageSection from "../components/configuration/sections/StorageSection";
import AgentSection from "../components/configuration/sections/AgentSection";
import ModelsSection from "../components/configuration/sections/ModelsSection";
import ApiKeysSection from "../components/configuration/sections/ApiKeysSection";
import EnvImportModal from "../components/configuration/EnvImportModal";

// Utilities
import {
  shouldHighlightUseSameCluster,
  copyWeaviateValuesToStorage,
} from "../components/configuration/utils/configUtils";
import { ToastContext } from "../components/contexts/ToastContext";

/**
 * Main Settings Page Component - Refactored for better maintainability
 *
 * This component orchestrates the entire configuration interface, including:
 * - Configuration selection and management (sidebar/mobile dropdown)
 * - Config name editing with validation
 * - Save/cancel/delete actions with proper state management
 * - Multiple configuration sections (Weaviate, Storage, Agent, Models, API Keys)
 * - Environment file import functionality
 *
 * The component uses custom hooks for state management and validation,
 * and breaks down the UI into focused, reusable components.
 */
export default function Home() {
  const {
    id,
    userConfig,
    configIDs,
    updateConfig,
    handleCreateConfig,
    getConfigIDs,
    handleLoadConfig,
    handleDeleteConfig,
    loadingConfig,
    loadingConfigs,
    savingConfig,
    updateUnsavedChanges,
  } = useContext(SessionContext);

  // Configuration state management
  const {
    currentUserConfig,
    currentFrontendConfig,
    changedConfig,
    matchingConfig,
    editName,
    isNewConfig,
    isDefaultConfig,
    nameExists,
    nameIsEmpty,
    setCurrentUserConfig,
    setCurrentFrontendConfig,
    setChangedConfig,
    setEditName,
    updateFields,
    updateFrontendFields,
    updateSettingsFields,
    cancelConfig,
  } = useConfigState(userConfig, configIDs);

  const { showConfirmModal } = useContext(ToastContext);

  // Models data state
  const [modelsData, setModelsData] = useState<{
    [key: string]: ModelProvider;
  } | null>(null);
  const [loadingModels, setLoadingModels] = useState<boolean>(true);

  // VSM Tenant/Profile state
  const [currentTenantId, setCurrentTenantId] = useState<string>(getTenantId());
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(getSelectedProfileId());
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);

  // Configuration validation
  const {
    currentValidation,
    getMissingApiKeys,
    getStorageIssues,
    isConfigValid,
    getWeaviateIssues,
    getModelsIssues,
    getApiKeysIssues,
  } = useConfigValidation(currentUserConfig, currentFrontendConfig, modelsData);

  // API key management
  const {
    addAPIKey,
    addAllMissingAPIKeys,
    removeAPIKey,
    updateAPIKeys,
    parseEnvContent,
  } = useApiKeyManagement(
    currentUserConfig,
    setCurrentUserConfig,
    setChangedConfig,
    getMissingApiKeys
  );

  // Modal and UI state
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(true);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState<boolean>(false);
  const [envContent, setEnvContent] = useState<string>("");

  // Fetch models data on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        const modelsPayload = await getModels();
        if (modelsPayload.error) {
          console.error("Error fetching models:", modelsPayload.error);
        } else {
          setModelsData(modelsPayload.models);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Load profiles when tenant changes
  const loadProfiles = async (tenantId: string) => {
    if (!tenantId.trim()) return;

    try {
      setLoadingProfiles(true);
      const profilesPayload = await getProfiles();
      if (profilesPayload.error) {
        console.error("Error fetching profiles:", profilesPayload.error);
        setAvailableProfiles([]);
      } else {
        setAvailableProfiles(profilesPayload.profiles || []);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
      setAvailableProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadProfiles(currentTenantId);
  }, [currentTenantId]);

  // Helper function to handle saving configuration
  const handleSaveConfig = async (setDefault: boolean = false) => {
    if (currentUserConfig && currentFrontendConfig) {
      const success = await updateConfig(
        {
          backend: currentUserConfig,
          frontend: currentFrontendConfig,
        },
        setDefault
      );
      if (success) {
        setChangedConfig(false);
        setEditName(false);
      }
    }
  };

  // Helper function to handle config selection
  const selectConfig = (configId: string) => {
    if (id) {
      if (changedConfig) {
        showConfirmModal(
          "Unsaved Changes",
          "You have unsaved changes. Are you sure you want to load a new config?",
          () => selectConfigFunction(configId)
        );
      } else {
        selectConfigFunction(configId);
      }
    }
  };

  const selectConfigFunction = (configId: string) => {
    if (id) {
      handleLoadConfig(id, configId);
      setEditName(false);
    }
  };

  // Helper function to handle storage cluster copying
  const copyWeaviateValuesToConfigStorage = () => {
    const updatedConfig = copyWeaviateValuesToStorage(
      currentUserConfig,
      currentFrontendConfig
    );
    if (updatedConfig) {
      setCurrentFrontendConfig(updatedConfig);
      setChangedConfig(true);
    }
  };

  // Helper function to create a new config
  const handleCreateConfigWithUniqueName = async () => {
    if (changedConfig) {
      showConfirmModal(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to create a new config?",
        () => handleCreateConfigFunction()
      );
    } else {
      handleCreateConfigFunction();
    }
  };

  const handleCreateConfigFunction = async () => {
    if (!id) return;
    await handleCreateConfig(id);
    setChangedConfig(false);
    setEditName(false);
  };

  // Helper function to handle environment file import
  const handleEnvSubmit = () => {
    if (envContent.trim()) {
      parseEnvContent(envContent);
      setEnvContent("");
      setIsEnvModalOpen(false);
    }
  };

  // Calculate helper values
  const shouldHighlight = shouldHighlightUseSameCluster(
    currentUserConfig,
    currentFrontendConfig
  );

  useEffect(() => {
    updateUnsavedChanges(changedConfig);
  }, [changedConfig]);

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="flex flex-col w-full gap-4 min-h-0 items-start justify-start h-full fade-in p-2 lg:p-4">
        {/* Mobile Config Selector - Only visible on small screens */}
        <ConfigSidebar
          currentUserConfig={currentUserConfig}
          configIDs={configIDs}
          loadingConfigs={loadingConfigs}
          onCreateConfig={handleCreateConfigWithUniqueName}
          onRefreshConfigs={() => {
            if (id) {
              getConfigIDs(id);
            }
          }}
          onSelectConfig={selectConfig}
          onDeleteConfig={(configId, isCurrentConfig) => {
            if (id) {
              handleDeleteConfig(id, configId, isCurrentConfig);
            }
          }}
        />

        <div className="flex flex-row w-full gap-4 min-h-0 items-start justify-start h-full">
          {/* Desktop Sidebar */}
          <DesktopConfigSidebar
            currentUserConfig={currentUserConfig}
            configIDs={configIDs}
            loadingConfigs={loadingConfigs}
            onCreateConfig={handleCreateConfigWithUniqueName}
            onRefreshConfigs={() => {
              if (id) {
                getConfigIDs(id);
              }
            }}
            onSelectConfig={selectConfig}
            onDeleteConfig={(configId, isCurrentConfig) => {
              if (id) {
                handleDeleteConfig(id, configId, isCurrentConfig);
              }
            }}
          />

          {/* Main Content Area */}
          <div className="flex w-full lg:w-3/4 xl:w-4/5 flex-col min-h-0 h-full fade-in">
            {currentUserConfig && currentFrontendConfig && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 w-full py-4 flex-shrink-0"
              >
                {/* Configuration Name Editor */}
                <ConfigNameEditor
                  currentUserConfig={currentUserConfig}
                  editName={editName}
                  nameExists={nameExists}
                  nameIsEmpty={nameIsEmpty}
                  isNewConfig={isNewConfig}
                  isDefaultConfig={isDefaultConfig}
                  loadingConfigs={loadingConfigs}
                  onNameChange={(name) => updateFields("name", name)}
                  onEditStart={() => setEditName(true)}
                  onEditEnd={() => setEditName(false)}
                />

                {/* Configuration Actions */}
                <ConfigActions
                  changedConfig={changedConfig}
                  matchingConfig={matchingConfig}
                  isNewConfig={isNewConfig}
                  isDefaultConfig={isDefaultConfig}
                  isConfigValid={isConfigValid}
                  nameExists={nameExists}
                  nameIsEmpty={nameIsEmpty}
                  loadingConfig={loadingConfig}
                  loadingConfigs={loadingConfigs}
                  savingConfig={savingConfig}
                  saveAsDefault={saveAsDefault}
                  userConfigId={userConfig?.backend?.id}
                  onSaveAsDefaultChange={setSaveAsDefault}
                  onSaveConfig={handleSaveConfig}
                  onCancelConfig={cancelConfig}
                  onDeleteConfig={() => {
                    if (id && userConfig?.backend?.id) {
                      handleDeleteConfig(id, userConfig.backend.id, true);
                    }
                  }}
                />
              </motion.div>
            )}

            {/* Scrollable Configuration Sections */}
            {userConfig ? (
              <div
                className={`flex flex-col gap-6 overflow-y-auto pb-8 flex-1 min-h-0 fade-in transition-opacity mb-8 ${
                  loadingConfig ? "opacity-70" : "opacity-100"
                }`}
              >
                <div className="flex flex-col gap-2">
                  {/* Weaviate Cluster Configuration */}
                  <WeaviateSection
                    currentUserConfig={currentUserConfig}
                    currentFrontendConfig={currentFrontendConfig}
                    weaviateIssues={getWeaviateIssues()}
                    wcdUrlValid={currentValidation.wcd_url}
                    wcdApiKeyValid={currentValidation.wcd_api_key}
                    customWeaviateHttpHostValid={
                      currentValidation.custom_weaviate_http_host
                    }
                    customWeaviateGrpcHostValid={
                      currentValidation.custom_weaviate_grpc_host
                    }
                    onUpdateSettings={updateSettingsFields}
                    onUpdateFrontend={updateFrontendFields}
                  />

                  {/* Elysia Storage Configuration */}
                  <StorageSection
                    currentFrontendConfig={currentFrontendConfig}
                    storageIssues={getStorageIssues}
                    shouldHighlightUseSameCluster={shouldHighlight}
                    onUpdateFrontend={updateFrontendFields}
                    onCopyWeaviateValues={copyWeaviateValuesToConfigStorage}
                    customStorageHttpHostValid={
                      currentValidation.custom_storage_http_host
                    }
                    customStorageGrpcHostValid={
                      currentValidation.custom_storage_grpc_host
                    }
                  />

                  {/* Agent Configuration */}
                  <AgentSection
                    currentUserConfig={currentUserConfig}
                    onUpdateFields={updateFields}
                    onUpdateSettings={updateSettingsFields}
                  />

                  {/* Models Configuration */}
                  <ModelsSection
                    currentUserConfig={currentUserConfig}
                    modelsData={modelsData}
                    loadingModels={loadingModels}
                    modelsIssues={getModelsIssues()}
                    baseProviderValid={currentValidation.base_provider}
                    baseModelValid={currentValidation.base_model}
                    complexProviderValid={currentValidation.complex_provider}
                    complexModelValid={currentValidation.complex_model}
                    onUpdateSettings={updateSettingsFields}
                    onUpdateConfig={setCurrentUserConfig}
                    setChangedConfig={setChangedConfig}
                  />

                  {/* API Keys Configuration */}
                  <ApiKeysSection
                    currentUserConfig={currentUserConfig}
                    apiKeysIssues={getApiKeysIssues()}
                    onAddAPIKey={addAPIKey}
                    onAddAllMissingAPIKeys={addAllMissingAPIKeys}
                    onUpdateAPIKeys={updateAPIKeys}
                    onRemoveAPIKey={removeAPIKey}
                    onOpenEnvModal={() => setIsEnvModalOpen(true)}
                  />

                  {/* VSM Tenant + Profile Configuration */}
                  <div className="bg-card rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">VSM Configuration</h3>
                      <div className="text-sm text-muted-foreground">
                        Tenant-scoped conversations & profiles
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Tenant ID Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tenant ID</label>
                        <input
                          type="text"
                          value={currentTenantId}
                          onChange={(e) => setCurrentTenantId(e.target.value)}
                          onBlur={() => {
                            if (currentTenantId.trim()) {
                              setTenantId(currentTenantId.trim());
                              // Reload conversations and profiles for new tenant
                              loadProfiles(currentTenantId.trim());
                            }
                          }}
                          placeholder="default"
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        />
                        <p className="text-xs text-muted-foreground">
                          Changing tenant will reload conversations and available profiles
                        </p>
                      </div>

                      {/* Profile Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Profile</label>
                        <select
                          value={currentProfileId || ""}
                          onChange={(e) => {
                            const newProfileId = e.target.value || null;
                            setCurrentProfileId(newProfileId);
                            setSelectedProfileId(newProfileId);
                          }}
                          disabled={loadingProfiles}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
                        >
                          <option value="">No profile selected (use defaults)</option>
                          {availableProfiles.map((profile) => (
                            <option key={profile.profile_id} value={profile.profile_id}>
                              {profile.name} {profile.is_default ? "(default)" : ""}
                            </option>
                          ))}
                        </select>
                        {loadingProfiles && (
                          <p className="text-xs text-muted-foreground">Loading profiles...</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Profile changes apply to new conversations only
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-primary shine">Loading config...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Environment Import Modal */}
      <EnvImportModal
        isOpen={isEnvModalOpen}
        envContent={envContent}
        onOpenChange={setIsEnvModalOpen}
        onEnvContentChange={setEnvContent}
        onSubmit={handleEnvSubmit}
        onCancel={() => {
          setIsEnvModalOpen(false);
          setEnvContent("");
        }}
      />
    </div>
  );
}
