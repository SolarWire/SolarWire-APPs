---
trigger: always_on
alwaysApply: true
---
# CLAUDE前端开发规范

This file provides guidance to Claude Code (claude.ai/code) when working with frontend code in this repository.

### 第一部分：核心编程原则 (Guiding Principles)
这是我们合作的顶层思想，指导所有具体的行为。

#### 基础设计原则
- **用户体验优先 (User Experience First)：** 所有技术决策都应以用户体验为出发点，追求性能、可访问性和直观性。
- **DRY (Don't Repeat Yourself)：** 通过组件化、Hook、工具函数等方式避免代码重复。
- **高内聚，低耦合 (High Cohesion, Low Coupling)：** 组件职责单一，通过 props 和状态管理实现松耦合。

#### 响应式设计原则
- **移动优先 (Mobile First)：** 优先考虑移动设备的体验，然后向桌面扩展。
- **渐进式增强 (Progressive Enhancement)：** 确保基础功能在所有设备上都能正常工作。
- **可访问性 (Accessibility)：** 遵循 WCAG 2.1 标准，确保所有用户都能使用应用。

#### DDD + TDD 融合开发方法论（前端适配）
- **领域驱动设计 (Domain-Driven Design)：** 通过功能模块和领域上下文组织代码结构，业务逻辑与 UI 组件分离。
- **组件驱动开发 (Component-Driven Development)：** 以组件为核心，每个组件都有对应的测试和故事。
- **测试驱动开发 (Test-Driven Development)：** 使用 Jest、React Testing Library 等工具，先写测试再写实现。
- **渐进式开发策略：** 从简单组件开始，逐步构建复杂功能，每个阶段都有相应测试。
- **AI 辅助开发优化：** 结合 AI 工具进行代码生成、重构建议和用户体验优化。

### 第二部分：具体执行指令 (Actionable Instructions)
这是 Claude 在前端开发中需要严格遵守的具体操作指南。

#### 沟通与语言规范
- **默认语言：** 请默认使用简体中文进行所有交流、解释和思考过程的陈述。
- **代码与术语：** 所有代码实体（变量名、函数名、组件名等）及技术术语必须保持英文原文。
- **注释规范：** 代码注释使用中文，组件和函数必须有 JSDoc 格式的文档。
- **TypeScript 优先：** 所有新项目优先使用 TypeScript，提供完整的类型定义。

#### 批判性反馈与破框思维
- **性能意识：** 关注包大小、渲染性能、内存使用等指标。
- **可访问性检查：** 确保所有交互元素都有适当的 ARIA 标签和键盘导航支持。
- **跨浏览器兼容性：** 考虑不同浏览器的兼容性和优雅降级。

#### 开发与调试策略 (Development & Debugging Strategy)

##### 组件开发策略
- **组件隔离：** 每个组件都应该能够独立开发、测试和使用。
- **Props 类型安全：** 使用 TypeScript 或 PropTypes 确保 props 类型安全。
- **状态管理规范：** 合理使用本地状态、全局状态，避免状态过度集中或分散。
- **副作用处理：** 正确处理异步操作、定时器等副作用。

##### 测试驱动开发 (TDD) 规范
- **测试框架：** 使用 Jest + React Testing Library / Vue Test Utils
- **测试分层：** 
  1. **单元测试：** 测试单个组件或函数的功能
  2. **集成测试：** 测试组件间的交互
  3. **端到端测试：** 使用 Cypress 或 Playwright 测试完整用户流程
- **测试驱动流程：**
  1. **Red（红）：** 编写失败的测试用例
  2. **Green（绿）：** 编写最少代码使测试通过
  3. **Refactor（重构）：** 优化代码结构和性能
- **可访问性测试：** 使用 @testing-library/jest-dom 和 axe-core 进行可访问性测试

##### AI 辅助开发指导原则
- **代码生成审查：** 对 AI 生成的代码进行性能、可访问性和最佳实践检查。
- **设计系统集成：** 确保 AI 生成的组件符合项目的设计系统规范。
- **用户体验优化：** 利用 AI 工具分析用户行为，优化界面交互。

#### 性能优化策略
- **代码分割：** 使用动态导入实现路由和组件的懒加载。
- **图片优化：** 使用 WebP 格式，实现响应式图片和懒加载。
- **缓存策略：** 合理使用浏览器缓存、CDN 和 Service Worker。
- **包大小优化：** 定期分析包大小，移除未使用的代码。

#### 项目与代码维护
- **代码风格一致性：** 使用 ESLint + Prettier 统一代码风格。
- **组件文档：** 使用 Storybook 维护组件库文档。
- **Git 提交规范：** 使用 Conventional Commits 规范提交信息。

## 常用命令

### 项目初始化和管理
# 创建项目
npx create-react-app my-app --template typescript
# 或者
npm create vue@latest my-app

# 安装依赖
npm install
# 或者
yarn install
# 或者
pnpm install

# 启动开发服务器
npm run dev
# 或者
npm start

# 构建生产版本
npm run build

# 运行测试
npm test
npm run test:coverage

### 代码质量检查
# ESLint 检查
npm run lint
npx eslint src/

# Prettier 格式化
npm run format
npx prettier --write src/

# TypeScript 类型检查
npx tsc --noEmit

# 测试覆盖率
npm run test:coverage

### 开发工具
# 启动 Storybook
npm run storybook

# 包大小分析
npm run build:analyze
npx webpack-bundle-analyzer build/static/js/*.js

# 性能分析
npm run build:profile

## 项目架构概览

### 推荐项目结构（React/Vue 通用）
src/
├── components/          # 通用组件
│   ├── ui/             # 基础 UI 组件
│   ├── layout/         # 布局组件
│   └── common/         # 通用业务组件
├── pages/              # 页面组件
│   ├── home/
│   ├── about/
│   └── contact/
├── features/           # 功能模块
│   ├── auth/           # 认证功能
│   ├── user/           # 用户管理
│   └── product/        # 产品管理
├── hooks/              # 自定义 Hook
├── store/              # 状态管理
│   ├── slices/         # Redux Toolkit slices
│   └── api/            # API 查询
├── services/           # 业务服务
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
├── assets/             # 静态资源
├── styles/             # 样式文件
├── tests/              # 测试工具和配置
└── App.tsx             # 根组件

### 技术栈推荐

#### 核心框架选择
- **React 生态：** React 18+ + TypeScript + Vite
- **Vue 生态：** Vue 3 + TypeScript + Vite
- **Angular 生态：** Angular 15+ + TypeScript

#### 状态管理
- **React：** Redux Toolkit + RTK Query / Zustand / Jotai
- **Vue：** Pinia / Vuex
- **Angular：** NgRx / Akita

#### 样式解决方案
- **CSS-in-JS：** Styled-components / Emotion
- **CSS 框架：** Tailwind CSS / UnoCSS
- **组件库：** Ant Design / Material-UI / Element Plus

#### 工具链
- **构建工具：** Vite / Webpack
- **测试工具：** Jest + Testing Library + Cypress
- **代码质量：** ESLint + Prettier + Husky
- **文档工具：** Storybook + JSDoc

## 开发指南

### 组件化开发（DDD 在前端的实现）

#### 领域组件设计
// types/user.ts - 用户领域类型
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

// components/user/UserCard.tsx - 用户卡片组件
import React from 'react';
import { User } from '../../types/user';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  className?: string;
}

/**
 * 用户卡片组件
 * 用于显示用户基本信息
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  className
}) => {
  return (
    <div 
      className={`user-card ${className}`}
      role="article"
      aria-label={`用户 ${user.name} 的信息`}
    >
      <div className="user-card__avatar">
        <img 
          src={user.avatar || '/default-avatar.png'} 
          alt={`${user.name} 的头像`}
          loading="lazy"
        />
      </div>
      
      <div className="user-card__content">
        <h3 className="user-card__name">{user.name}</h3>
        <p className="user-card__email">{user.email}</p>
        <span className="user-card__role">{user.role}</span>
      </div>
      
      <div className="user-card__actions">
        {onEdit && (
          <button 
            onClick={() => onEdit(user)}
            aria-label={`编辑用户 ${user.name}`}
          >
            编辑
          </button>
        )}
        {onDelete && (
          <button 
            onClick={() => onDelete(user.id)}
            aria-label={`删除用户 ${user.name}`}
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
};

#### 自定义 Hook 模式
// hooks/useUser.ts - 用户相关 Hook
import { useState, useEffect } from 'react';
import { User } from '../types/user';
import { userService } from '../services/userService';

export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await userService.getById(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await userService.update(user.id, updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户失败');
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    updateUser
  };
};

#### 状态管理模式（Redux Toolkit）
// store/userSlice.ts - 用户状态管理
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../types/user';
import { userService } from '../services/userService';

interface UserState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null
};

// 异步 thunk
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getAll();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取用户列表失败');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      return await userService.create(userData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '创建用户失败');
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      });
  }
});

export const { clearError, setCurrentUser } = userSlice.actions;
export default userSlice.reducer;

### 测试驱动开发示例

#### 组件单元测试
// __tests__/components/UserCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserCard } from '../components/user/UserCard';
import { User, UserRole } from '../types/user';

const mockUser: User = {
  id: '1',
  name: '张三',
  email: 'zhangsan@example.com',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('UserCard', () => {
  it('应该正确显示用户信息', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
  });

  it('应该在点击编辑按钮时调用 onEdit 回调', () => {
    const onEditMock = jest.fn();
    render(<UserCard user={mockUser} onEdit={onEditMock} />);
    
    const editButton = screen.getByRole('button', { name: /编辑用户 张三/ });
    fireEvent.click(editButton);
    
    expect(onEditMock).toHaveBeenCalledWith(mockUser);
  });

  it('应该在点击删除按钮时调用 onDelete 回调', () => {
    const onDeleteMock = jest.fn();
    render(<UserCard user={mockUser} onDelete={onDeleteMock} />);
    
    const deleteButton = screen.getByRole('button', { name: /删除用户 张三/ });
    fireEvent.click(deleteButton);
    
    expect(onDeleteMock).toHaveBeenCalledWith('1');
  });

  it('应该具有正确的可访问性属性', () => {
    render(<UserCard user={mockUser} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', '用户 张三 的信息');
    
    const avatar = screen.getByAltText('张三 的头像');
    expect(avatar).toBeInTheDocument();
  });
});

#### Hook 测试
// __tests__/hooks/useUser.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from '../hooks/useUser';
import { userService } from '../services/userService';

jest.mock('../services/userService');

const mockUserService = userService as jest.Mocked<typeof userService>;

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确获取用户数据', async () => {
    const mockUser = {
