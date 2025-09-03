import React from "react";
import { GroupedMessages, TaskStatus } from "@/types";
import { MessageAvatar } from "./MessageAvatar";
import { MessageContent } from "./content/MessageContent";
import { isToolResultContentBlock, isImageContentBlock } from "@bytebot/shared";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MemoryBanner } from "../memory/MemoryBanner";
import { MessageContentType } from "@bytebot/shared";
import { MemorySaveButton } from "../memory/MemorySaveButton";
import { isTextContentBlock } from "@bytebot/shared";
import { RagBanner } from "../rag/RagBanner";

interface AssistantMessageProps {
  group: GroupedMessages;
  taskStatus: TaskStatus;
  messageIdToIndex: Record<string, number>;
}

export function AssistantMessage({
  group,
  taskStatus,
  messageIdToIndex,
}: AssistantMessageProps) {
  return (
    <div className={
      cn(
        "bg-bytebot-bronze-light-3 flex items-start justify-start gap-2 px-4 py-3 border-x border-bytebot-bronze-light-7",
        ![TaskStatus.RUNNING, TaskStatus.NEEDS_HELP].includes(taskStatus) && !group.take_over && "border-b border-bytebot-bronze-light-7 rounded-b-lg"
      )}
    >
      <MessageAvatar role={group.role} />

      {group.take_over ? (
        <div className="border-bytebot-bronze-light-a6 bg-bytebot-bronze-light-a1 w-full rounded-2xl border p-2">
          <div className="flex items-center gap-2">
            <Image
              src="/indicators/indicator-pink.png"
              alt="User control status"
              width={15}
              height={15}
            />
            <p className="text-bytebot-bronze-light-12 text-[12px] font-medium">
              You took control
            </p>
          </div>
          <div className="bg-bytebot-bronze-light-2 mt-2 space-y-0.5 rounded-2xl p-1">
            {/* RAG + Memory banners (if annotated) */}
            {(() => {
              const first = group.messages[0];
              const rag = first?.content?.find(
                (b: any) => b?.type === MessageContentType.RagContext,
              ) as any;
              return rag?.items?.length ? (
                <RagBanner items={rag.items} />
              ) : null;
            })()}
            {(() => {
              const first = group.messages[0];
              const mem = first?.content?.find(
                (b: any) => b?.type === MessageContentType.MemoryContext,
              ) as any;
              return mem?.items?.length ? (
                <MemoryBanner items={mem.items} />
              ) : null;
            })()}
            <div className="flex justify-end">
              <MemorySaveButton
                taskId={group.messages[0].taskId}
                getSnippet={() =>
                  group.messages
                    .flatMap((m) => m.content)
                    .filter((b: any) => isTextContentBlock(b))
                    .map((b: any) => (b as any).text as string)
                    .join("\n")
                }
              />
            </div>
            {group.messages.map((message) => (
              <div
                key={message.id}
                data-message-index={messageIdToIndex[message.id]}
              >
                {/* Render hidden divs for each screenshot block */}
                {message.content.map((block, blockIndex) => {
                  if (
                    isToolResultContentBlock(block) &&
                    block.content &&
                    block.content.length > 0
                  ) {
                    // Check ALL content items in the tool result, not just the first one
                    const markers: React.ReactNode[] = [];
                    block.content.forEach((contentItem, contentIndex) => {
                      if (isImageContentBlock(contentItem)) {
                        markers.push(
                          <div
                            key={`${blockIndex}-${contentIndex}`}
                            data-message-index={messageIdToIndex[message.id]}
                            data-block-index={blockIndex}
                            data-content-index={contentIndex}
                            style={{
                              position: "absolute",
                              width: 0,
                              height: 0,
                              overflow: "hidden",
                            }}
                          />
                        );
                      }
                    });
                    return markers;
                  }
                  return null;
                })}
                <MessageContent
                  content={message.content}
                  isTakeOver={message.take_over}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* RAG + Memory banners (if annotated) */}
          {(() => {
            const first = group.messages[0];
            const rag = first?.content?.find(
              (b: any) => b?.type === MessageContentType.RagContext,
            ) as any;
            return rag?.items?.length ? <RagBanner items={rag.items} /> : null;
          })()}
          {(() => {
            const first = group.messages[0];
            const mem = first?.content?.find(
              (b: any) => b?.type === MessageContentType.MemoryContext,
            ) as any;
            return mem?.items?.length ? (
              <MemoryBanner items={mem.items} />
            ) : null;
          })()}
          <div className="flex justify-end">
            <MemorySaveButton
              taskId={group.messages[0].taskId}
              getSnippet={() =>
                group.messages
                  .flatMap((m) => m.content)
                  .filter((b: any) => isTextContentBlock(b))
                  .map((b: any) => (b as any).text as string)
                  .join("\n")
              }
            />
          </div>
          {group.messages.map((message) => (
            <div
              key={message.id}
              data-message-index={messageIdToIndex[message.id]}
            >
              {/* Render hidden divs for each screenshot block */}
              {message.content.map((block, blockIndex) => {
                if (
                  isToolResultContentBlock(block) &&
                  !block.is_error &&
                  block.content &&
                  block.content.length > 0
                ) {
                  // Check ALL content items in the tool result, not just the first one
                  const markers: React.ReactNode[] = [];
                  block.content.forEach((contentItem, contentIndex) => {
                    if (isImageContentBlock(contentItem)) {
                      markers.push(
                        <div
                          key={`${blockIndex}-${contentIndex}`}
                          data-message-index={messageIdToIndex[message.id]}
                          data-block-index={blockIndex}
                          data-content-index={contentIndex}
                          style={{
                            position: "absolute",
                            width: 0,
                            height: 0,
                            overflow: "hidden",
                          }}
                        />
                      );
                    }
                  });
                  return markers;
                }
                return null;
              })}
              <MessageContent
                content={message.content}
                isTakeOver={message.take_over}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
