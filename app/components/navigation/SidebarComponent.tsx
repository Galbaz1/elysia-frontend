"use client";

import React, { useContext, useEffect, useState } from "react";

import { SocketContext } from "../contexts/SocketContext";

import { MdChatBubbleOutline } from "react-icons/md";
import { GoDatabase } from "react-icons/go";
import { AiOutlineExperiment } from "react-icons/ai";
import { FaCircle } from "react-icons/fa6";
import { MdOutlineSettingsInputComponent } from "react-icons/md";
import { IoIosWarning } from "react-icons/io";

import HomeSubMenu from "@/app/components/navigation/HomeSubMenu";
import DataSubMenu from "@/app/components/navigation/DataSubMenu";
import EvalSubMenu from "@/app/components/navigation/EvalSubMenu";

import { CgFileDocument } from "react-icons/cg";

import { CgWebsite } from "react-icons/cg";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

import { RiRobot2Line } from "react-icons/ri";

import { public_path } from "@/app/components/host";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SettingsSubMenu from "./SettingsSubMenu";
import { RouterContext } from "../contexts/RouterContext";
import { CollectionContext } from "../contexts/CollectionContext";
import { SessionContext } from "../contexts/SessionContext";
import packageJson from "../../../package.json";

const SidebarComponent: React.FC = () => {
  const { socketOnline } = useContext(SocketContext);
  const { changePage, currentPage } = useContext(RouterContext);
  const { collections, loadingCollections } = useContext(CollectionContext);
  const { unsavedChanges } = useContext(SessionContext);

  const [items, setItems] = useState<
    {
      title: string;
      mode: string[];
      icon: React.ReactNode;
      warning?: boolean;
      loading?: boolean;
      onClick: () => void;
    }[]
  >([]);

  useEffect(() => {
    const _items = [
      {
        title: "Chat",
        mode: ["chat"],
        icon: <MdChatBubbleOutline />,
        onClick: () => changePage("chat", {}, true, unsavedChanges),
      },
      {
        title: "Data",
        mode: ["data", "collection"],
        icon: !collections?.some((c) => c.processed === true) ? (
          <IoIosWarning className="text-warning" />
        ) : (
          <GoDatabase />
        ),
        warning: !collections?.some((c) => c.processed === true),
        loading: loadingCollections,
        onClick: () => changePage("data", {}, true, unsavedChanges),
      },
      {
        title: "Settings",
        mode: ["settings", "elysia"],
        icon: <MdOutlineSettingsInputComponent />,
        onClick: () => changePage("settings", {}, true, unsavedChanges),
      },
      {
        title: "Evaluation",
        mode: ["eval", "feedback", "display"],
        icon: <AiOutlineExperiment />,
        onClick: () => changePage("eval", {}, true, unsavedChanges),
      },
    ];
    setItems(_items);
  }, [collections, unsavedChanges]);

  const openNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <Sidebar className="fade-in">
      <SidebarHeader>
        <div className={`flex items-center gap-2 w-full justify-between p-2`}>
          <div className="flex items-center gap-2">
            <img
              src={`${public_path}logo.svg`}
              alt="Elysia"
              className="w-5 h-5 stext-primary"
            />
            <p className="text-sm font-bold text-primary">Elysia</p>
          </div>
          <div className="flex items-center justify-center gap-1">
            {socketOnline ? (
              <FaCircle scale={0.2} className="text-lg pulsing_color w-5 h-5" />
            ) : (
              <FaCircle scale={0.2} className="text-lg pulsing w-5 h-5" />
            )}
            <div className="flex flex-col items-end">
              <p className="text-xs text-muted-foreground">
                v{packageJson.version}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    variant={
                      item.mode.includes(currentPage)
                        ? "active"
                        : item.warning
                          ? "warning"
                          : "default"
                    }
                    onClick={item.onClick}
                  >
                    <p className="flex items-center gap-2">
                      {item.loading ? (
                        <FaCircle
                          scale={0.2}
                          className="text-lg pulsing_color"
                        />
                      ) : item.warning ? (
                        <IoIosWarning className="text-warning" />
                      ) : (
                        item.icon
                      )}
                      <span>{item.title}</span>
                    </p>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {currentPage === "chat" && <HomeSubMenu />}
        {(currentPage === "data" || currentPage === "collection") && (
          <DataSubMenu />
        )}
        {(currentPage === "eval" ||
          currentPage === "feedback" ||
          currentPage === "display") && <EvalSubMenu />}
        {(currentPage === "settings" || currentPage === "elysia") && (
          <SettingsSubMenu />
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full justify-start items-center"
              onClick={() => openNewTab("https://weaviate.github.io/elysia/")}
            >
              <CgFileDocument />
              <span>Documentation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full justify-start items-center"
              onClick={() => openNewTab("https://github.com/weaviate/elysia")}
            >
              <FaGithub />
              <span>Github</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <img
                    src={`${public_path}hva-logo.png`}
                    alt="Hogeschool van Amsterdam"
                    className="h-6 w-auto"
                  />
                  <p>HvA</p>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem
                  onClick={() => openNewTab("https://www.hva.nl/")}
                >
                  <CgWebsite />
                  <span>HvA Website</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    openNewTab("https://www.hva.nl/samenwerken/labs/maintenance-lab")
                  }
                >
                  <RiRobot2Line />
                  <span>Maintenance Lab</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    openNewTab("https://www.linkedin.com/in/stepintoliquid/")
                  }
                >
                  <FaLinkedin />
                  <span>Built by Fausto Albers</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarComponent;
