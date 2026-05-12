import { createMiddleware } from "langchain";

let callCount = 0;
export const logToolCallMiddleware = createMiddleware({
  name: "logToolCall",
  wrapToolCall: async (request, handler) => {
    callCount++;
    const toolName = request.toolCall.name;
    console.log(
      `[middleware] Tool call #${callCount}: ${toolName} args: ${JSON.stringify(request.toolCall.args)}`,
    );
    const result = await handler(request);
    console.log(
      `[middleware] toolCall completed: ${toolName} count: #${callCount}`,
    );
    return result;
  },
});

export const agentMiddlewares = [logToolCallMiddleware];
