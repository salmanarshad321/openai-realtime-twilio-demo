import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Check, AlertCircle } from "lucide-react";
import { toolTemplates } from "@/lib/tool-templates";
import { ToolConfigurationDialog } from "./tool-configuration-dialog";
import { BackendTag } from "./backend-tag";
import { useBackendTools } from "@/lib/use-backend-tools";

// Social cause instruction templates
const socialCauseTemplates = [
  {
    label: "Survey Collection",
    value: "survey",
    instructions: "You are conducting a survey about community needs and social issues. Ask thoughtful questions to gather opinions and feedback. Be respectful and empathetic when discussing sensitive topics. Ensure you collect demographic information if relevant, and thank participants for their time and valuable input."
  },
  {
    label: "Environmental Awareness",
    value: "environment",
    instructions: "You are an environmental advocate raising awareness about climate change and sustainability. Discuss topics like renewable energy, waste reduction, conservation practices, and how individuals can make a positive environmental impact. Provide practical tips and inspire action while being informative and encouraging."
  },
  {
    label: "Mental Health Support",
    value: "mental_health",
    instructions: "You are providing mental health awareness and support information. Listen actively, show empathy, and provide resources for mental health services. Always emphasize that professional help should be sought for serious issues. Focus on destigmatizing mental health conversations and promoting well-being."
  },
  {
    label: "Community Outreach",
    value: "community",
    instructions: "You are reaching out to community members to discuss local issues, events, and opportunities for civic engagement. Encourage participation in community activities, volunteer work, and local governance. Be friendly, inclusive, and focus on building stronger community connections."
  },
  {
    label: "Educational Support",
    value: "education",
    instructions: "You are promoting educational opportunities and literacy programs in the community. Discuss available resources, scholarships, tutoring programs, and adult education options. Encourage lifelong learning and help identify barriers to education that need to be addressed."
  },
  {
    label: "Healthcare Access",
    value: "healthcare",
    instructions: "You are discussing healthcare access and public health initiatives. Provide information about available health services, preventive care, health insurance options, and community health programs. Be sensitive to health concerns and emphasize the importance of regular medical care."
  },
  {
    label: "Poverty Alleviation",
    value: "poverty",
    instructions: "You are working on poverty alleviation initiatives and discussing economic empowerment. Talk about job training programs, financial literacy, food assistance, housing support, and other resources available to those in need. Be compassionate and non-judgmental while providing practical help."
  },
  {
    label: "Social Justice & Equality",
    value: "justice",
    instructions: "You are advocating for social justice and equality. Discuss issues related to discrimination, civil rights, fair treatment, and equal opportunities. Listen to concerns about injustice, provide information about legal resources, and promote understanding across different communities while encouraging peaceful advocacy."
  },
  {
    label: "Youth Development",
    value: "youth",
    instructions: "You are focused on youth development and empowerment programs. Discuss mentorship opportunities, after-school programs, career guidance, leadership development, and recreational activities for young people. Encourage youth engagement in positive activities and help them identify their potential and goals."
  },
  {
    label: "Senior Care & Support",
    value: "seniors",
    instructions: "You are providing support and resources for senior citizens. Discuss healthcare services for elderly, social programs, transportation assistance, housing options, and ways to combat social isolation among seniors. Show respect for their experience and wisdom while addressing their specific needs and concerns."
  }
];

interface SessionConfigurationPanelProps {
  callStatus: string;
  onSave: (config: any) => void;
}

const SessionConfigurationPanel: React.FC<SessionConfigurationPanelProps> = ({
  callStatus,
  onSave,
}) => {
  const [instructions, setInstructions] = useState(
    "You are a helpful assistant in a phone call."
  );
  const [selectedSocialCause, setSelectedSocialCause] = useState("custom");
  const [voice, setVoice] = useState("ash");
  const [tools, setTools] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingSchemaStr, setEditingSchemaStr] = useState("");
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Custom hook to fetch backend tools every 3 seconds
  const backendTools = useBackendTools(`${process.env.NEXT_PUBLIC_API_URL}/tools`, 3000);

  // Track changes to determine if there are unsaved modifications
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [instructions, voice, tools, selectedSocialCause]);

  // Handle social cause selection
  const handleSocialCauseChange = (value: string) => {
    setSelectedSocialCause(value);
    if (value && value !== "custom") {
      const template = socialCauseTemplates.find(t => t.value === value);
      if (template) {
        setInstructions(template.instructions);
      }
    }
  };

  // Reset save status after a delay when saved
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const configToSave = {
        instructions,
        voice,
        tools: tools.map((tool) => JSON.parse(tool)),
      };
      console.log("🟢 About to save configuration:", configToSave);
      await onSave(configToSave);
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      console.log("🟢 Configuration saved successfully");
    } catch (error) {
      console.error("🔴 Error saving configuration:", error);
      setSaveStatus("error");
    }
  };

  const handleAddTool = () => {
    setEditingIndex(null);
    setEditingSchemaStr("");
    setSelectedTemplate("");
    setIsJsonValid(true);
    setOpenDialog(true);
  };

  const handleEditTool = (index: number) => {
    setEditingIndex(index);
    setEditingSchemaStr(tools[index] || "");
    setSelectedTemplate("");
    setIsJsonValid(true);
    setOpenDialog(true);
  };

  const handleDeleteTool = (index: number) => {
    const newTools = [...tools];
    newTools.splice(index, 1);
    setTools(newTools);
  };

  const handleDialogSave = () => {
    try {
      JSON.parse(editingSchemaStr);
    } catch {
      return;
    }
    const newTools = [...tools];
    if (editingIndex === null) {
      newTools.push(editingSchemaStr);
    } else {
      newTools[editingIndex] = editingSchemaStr;
    }
    setTools(newTools);
    setOpenDialog(false);
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplate(val);

    // Determine if the selected template is from local or backend
    let templateObj =
      toolTemplates.find((t) => t.name === val) ||
      backendTools.find((t: any) => t.name === val);

    if (templateObj) {
      setEditingSchemaStr(JSON.stringify(templateObj, null, 2));
      setIsJsonValid(true);
    }
  };

  const onSchemaChange = (value: string) => {
    setEditingSchemaStr(value);
    try {
      JSON.parse(value);
      setIsJsonValid(true);
    } catch {
      setIsJsonValid(false);
    }
  };

  const getToolNameFromSchema = (schema: string): string => {
    try {
      const parsed = JSON.parse(schema);
      return parsed?.name || "Untitled Tool";
    } catch {
      return "Invalid JSON";
    }
  };

  const isBackendTool = (name: string): boolean => {
    return backendTools.some((t: any) => t.name === name);
  };

  return (
    <Card className="flex flex-col h-full w-full mx-auto">
      <CardHeader className="pb-0 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Call Configuration
          </CardTitle>
          <div className="flex items-center gap-2">
            {saveStatus === "error" ? (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Save failed
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-xs text-muted-foreground">Not saved</span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3 sm:p-5">
        <ScrollArea className="h-full">
          <div className="space-y-4 sm:space-y-6 m-1">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Social Cause Templates
              </label>
              <Select value={selectedSocialCause} onValueChange={handleSocialCauseChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a social cause to auto-fill instructions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Instructions</SelectItem>
                  {socialCauseTemplates.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Instructions
              </label>
              <Textarea
                placeholder="Enter instructions"
                className="min-h-[100px] resize-none"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Voice</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {["ash", "ballad", "coral", "sage", "verse"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Tools</label>
              <div className="space-y-2">
                {tools.map((tool, index) => {
                  const name = getToolNameFromSchema(tool);
                  const backend = isBackendTool(name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2 sm:p-3 gap-2"
                    >
                      <span className="text-sm truncate flex-1 min-w-0 flex items-center">
                        {name}
                        {backend && <BackendTag />}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTool(index)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTool(index)}
                          className="h-8 w-8"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddTool}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={saveStatus === "saving" || !hasUnsavedChanges}
            >
              {saveStatus === "saving" ? (
                "Saving..."
              ) : saveStatus === "saved" ? (
                <span className="flex items-center">
                  Saved Successfully
                  <Check className="ml-2 h-4 w-4" />
                </span>
              ) : saveStatus === "error" ? (
                "Error Saving"
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </ScrollArea>
      </CardContent>

      <ToolConfigurationDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        editingIndex={editingIndex}
        selectedTemplate={selectedTemplate}
        editingSchemaStr={editingSchemaStr}
        isJsonValid={isJsonValid}
        onTemplateChange={handleTemplateChange}
        onSchemaChange={onSchemaChange}
        onSave={handleDialogSave}
        backendTools={backendTools}
      />
    </Card>
  );
};

export default SessionConfigurationPanel;
