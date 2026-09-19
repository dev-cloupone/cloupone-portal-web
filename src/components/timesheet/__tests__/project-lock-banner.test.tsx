import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectLockBanner } from '../project-lock-banner'

describe('ProjectLockBanner', () => {
  it('nao renderiza nada quando nao ha projeto bloqueado', () => {
    const { container } = render(<ProjectLockBanner lockedProjects={[]} month="2026-02" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza no singular quando ha um projeto bloqueado', () => {
    render(
      <ProjectLockBanner
        lockedProjects={[{ projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-05' }]}
        month="2026-02"
      />,
    )
    expect(screen.getByText(/1 projeto bloqueado para apontamentos de Fev\/2026/)).toBeInTheDocument()
    expect(screen.getByText('Projeto A')).toBeInTheDocument()
  })

  it('agrupa varios projetos bloqueados em um unico card, no plural', () => {
    render(
      <ProjectLockBanner
        lockedProjects={[
          { projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-05' },
          { projectId: 'p2', projectName: 'Projeto B', deadline: '2026-02-05' },
          { projectId: 'p3', projectName: 'Projeto C', deadline: '2026-02-05' },
        ]}
        month="2026-02"
      />,
    )
    expect(screen.getByText(/3 projetos bloqueados para apontamentos de Fev\/2026/)).toBeInTheDocument()
    expect(screen.getByText('Projeto A')).toBeInTheDocument()
    expect(screen.getByText('Projeto B')).toBeInTheDocument()
    expect(screen.getByText('Projeto C')).toBeInTheDocument()
  })

  it('renderiza um unico card mesmo com muitos projetos bloqueados', () => {
    const { container } = render(
      <ProjectLockBanner
        lockedProjects={Array.from({ length: 8 }, (_, i) => ({
          projectId: `p${i}`,
          projectName: `Projeto ${i}`,
          deadline: '2026-02-05',
        }))}
        month="2026-02"
      />,
    )
    expect(container.querySelectorAll('.bg-danger-muted')).toHaveLength(1)
  })

  it('nao renderiza nada quando o mes ja esta aprovado, mesmo com projeto bloqueado', () => {
    const { container } = render(
      <ProjectLockBanner
        lockedProjects={[{ projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-05' }]}
        month="2026-02"
        monthStatus="approved"
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza normalmente quando o mes esta aberto ou reaberto', () => {
    render(
      <ProjectLockBanner
        lockedProjects={[{ projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-05' }]}
        month="2026-02"
        monthStatus="reopened"
      />,
    )
    expect(screen.getByText('Projeto A')).toBeInTheDocument()
  })
})
