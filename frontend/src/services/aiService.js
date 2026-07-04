// AI Workspace Intelligence Service
// Encapsulates NL Command parsing, summaries, and recommendation heuristics.
// Connects dynamically to mock LLM models and is future-integration ready.

const PROVIDERS = {
  GEMINI: "gemini",
  OPENAI: "openai",
  CLAUDE: "claude",
  LOCAL: "local_mock"
};

// Toggle provider when connecting to actual LLM services
const ACTIVE_PROVIDER = PROVIDERS.LOCAL;

const parseNaturalLanguageCommand = async (command, context) => {
  const { tasks, members, currentUser } = context;
  const cmd = command.toLowerCase().trim();
  const todayStr = new Date().toISOString().split("T")[0];

  // Command 1: Show overdue tasks
  if (cmd.includes("overdue")) {
    const overdue = tasks.filter(t => t.status !== "completed" && t.due_date && t.due_date < todayStr);
    if (overdue.length === 0) return "Great job! There are no overdue tasks currently.";
    return `Here are the active overdue tasks in your workspace:\n` + 
      overdue.map(t => `- **${t.title}** (Was due: ${t.due_date})`).join("\n");
  }

  // Command 2: Show my pending work
  if (cmd.includes("my pending") || cmd.includes("pending work")) {
    const myPending = tasks.filter(t => t.status !== "completed" && t.assigned_to === currentUser?.id);
    if (myPending.length === 0) return "You have no active pending tasks on your checklist.";
    return `Your pending workload checklist:\n` + 
      myPending.map(t => `- **${t.title}** [Priority: ${t.priority || "Medium"}] (Due: ${t.due_date || "No date"})`).join("\n");
  }

  // Command 3: Show high priority tasks
  if (cmd.includes("high-priority") || cmd.includes("high priority")) {
    const high = tasks.filter(t => t.status !== "completed" && t.priority === "High");
    if (high.length === 0) return "Excellent! There are no active High Priority tasks pending.";
    return `High Priority tasks needing immediate attention:\n` + 
      high.map(t => `- **${t.title}** (Assigned to: ${members.find(m => m.id === t.assigned_to)?.name || "Unassigned"})`).join("\n");
  }

  // Command 4: Create a task for tomorrow
  if (cmd.includes("create task") || cmd.includes("create a task") || cmd.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
    // Extract title if possible
    let taskTitle = "AI Generated Task";
    const matches = command.match(/create (?:a )?task (?:for tomorrow )?named (.*)/i) || 
                    command.match(/create (?:a )?task (.*)/i);
    if (matches && matches[1]) {
      taskTitle = matches[1].replace(/for tomorrow/i, "").trim();
    }

    return {
      action: "CREATE_TASK",
      payload: {
        title: taskTitle,
        description: "Task generated via AI Natural Language Assistant interface.",
        due_date: tomorrowStr,
        priority: "Medium"
      },
      message: `I have pre-populated a new task creation request for tomorrow: **${taskTitle}** (Due: ${tomorrowStr}). Would you like to review and assign it?`
    };
  }

  // Command 5: Assign task to Rahul (or other team member)
  if (cmd.includes("assign")) {
    // Try to extract member name
    const words = cmd.split(" ");
    const assignIndex = words.indexOf("assign");
    let nameToFind = "";
    if (assignIndex !== -1 && words[assignIndex + 1]) {
      nameToFind = words[assignIndex + 1];
    }
    
    const matchedMember = members.find(m => m.name.toLowerCase().includes(nameToFind));
    if (!matchedMember) {
      return `I couldn't find a team member matching '${nameToFind}'. Try 'Assign task to [Member Name]'.`;
    }

    return {
      action: "ASSIGN_TASK",
      payload: {
        assigned_to: matchedMember.id
      },
      message: `Perfect! I've pre-configured the assignee fields to point to **${matchedMember.name}**. You can choose a task below to update.`
    };
  }

  // Command 6: Productivity Leaderboard
  if (cmd.includes("productive") || cmd.includes("leaderboard")) {
    const scores = members.map(m => {
      const uTasks = tasks.filter(t => t.assigned_to === m.id);
      const completed = uTasks.filter(t => t.status === "completed").length;
      return { name: m.name, completed };
    }).sort((a, b) => b.completed - a.completed);

    if (scores.length === 0 || scores[0].completed === 0) return "No tasks have been completed in the workspace yet.";
    return `Most productive member output ranking:\n` + 
      scores.map((s, idx) => `${idx + 1}. **${s.name}** (${s.completed} tasks completed)`).join("\n");
  }

  // Command 7: What should I work on next
  if (cmd.includes("work on next") || cmd.includes("what should i do")) {
    const myPendingHigh = tasks.find(t => t.status !== "completed" && t.assigned_to === currentUser?.id && t.priority === "High");
    const myPendingAny = tasks.find(t => t.status !== "completed" && t.assigned_to === currentUser?.id);
    
    if (myPendingHigh) {
      return `I recommend tackling **${myPendingHigh.title}** next. It is marked as **High Priority** and remains unresolved.`;
    }
    if (myPendingAny) {
      return `You have no high priority bottlenecks, so I suggest starting work on **${myPendingAny.title}**.`;
    }
    return "You have no active pending tasks in this workspace! Enjoy your free schedule or check in with your project manager.";
  }

  // Command 8: Summarize today's activity
  if (cmd.includes("summarize") || cmd.includes("today's activity") || cmd.includes("summary")) {
    const completedToday = tasks.filter(t => t.status === "completed" && t.completed_at && t.completed_at.startsWith(todayStr)).length;
    const createdToday = tasks.filter(t => t.created_at && t.created_at.startsWith(todayStr)).length;
    return `Workspace Activity Summary (Today):\n` +
      `- **${createdToday}** new tasks assigned today.\n` +
      `- **${completedToday}** tasks completed successfully by team members.\n` +
      `Workspace operations are running smoothly.`;
  }

  // Fallback chat dialogue
  return `Hi! I'm your TeamPulse AI Assistant. I can parse natural language commands or analyze workspace data. Try typing:\n` +
    `- "Show overdue tasks"\n` +
    `- "Show my pending work"\n` +
    `- "What should I work on next?"\n` +
    `- "Which member is most productive?"\n` +
    `- "Summarize today's activity"`;
};

export const aiService = {
  chat: async (message, context) => {
    if (ACTIVE_PROVIDER !== PROVIDERS.LOCAL) {
      // Future actual API integrations call block goes here:
      // return fetch("https://api.gemini.google.com/...", { ... })
    }
    return parseNaturalLanguageCommand(message, context);
  },

  calculateWorkspaceMetrics: (tasks, members) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const overdue = tasks.filter(t => t.status !== "completed" && t.due_date && t.due_date < todayStr).length;
    
    // Overall productivity score (completed / total ratio)
    const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 100;
    
    // Health score (starts at 100, drops by overdue ratios)
    const healthScore = total > 0 ? Math.max(0, 100 - Math.round((overdue / total) * 45)) : 100;
    
    // Risk score (ratio of overdue or active high-priority tasks)
    const activeHigh = tasks.filter(t => t.status !== "completed" && t.priority === "High").length;
    const riskScore = total > 0 ? Math.min(100, Math.round(((overdue + activeHigh) / total) * 100)) : 0;

    // Daily recommendations Heuristics
    const recommendations = [];
    const memberWorkloads = members.map(m => {
      const active = tasks.filter(t => t.assigned_to === m.id && t.status !== "completed").length;
      return { name: m.name, active };
    }).sort((a, b) => b.active - a.active);

    if (overdue > 0) {
      recommendations.push(`Assign overdue deadlines to active team members to clear backlog.`);
    }
    
    if (memberWorkloads.length > 0 && memberWorkloads[0].active > 3) {
      recommendations.push(`Balance workload: ${memberWorkloads[0].name} has ${memberWorkloads[0].active} active tasks.`);
    }

    if (activeHigh > 0) {
      recommendations.push(`Focus sprint targets on resolving the ${activeHigh} active High Priority blockers.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Workloads are balanced and all deadlines are currently on schedule.");
    }

    return {
      productivityScore,
      healthScore,
      riskScore,
      overdue,
      recommendations,
      nextActions: [
        "Review overdue task deadlines",
        "Reassign work from overloaded developers",
        "Clear High Priority workspace blockers"
      ]
    };
  }
};
