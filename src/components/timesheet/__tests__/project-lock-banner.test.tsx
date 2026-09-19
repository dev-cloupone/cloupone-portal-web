import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectLockBanner } from '../project-lock-banner'

describe('ProjectLockBanner', () => {
  it('nao renderiza nada quando nao ha bloqueio nem prazo proximo', () => {
    const { container } = render(
      <ProjectLockBanner lockedProjects={[]} upcomingDeadlines={[]} month="2026-02" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza uma linha por projeto bloqueado', () => {
    render(
      <ProjectLockBanner
        lockedProjects={[
          { projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-05' },
          { projectId: 'p2', projectName: 'Projeto B', deadline: '2026-02-05' },
        ]}
        upcomingDeadlines={[]}
        month="2026-02"
      />,
    )
    expect(screen.getByText(/Projeto A está bloqueado para apontamentos de Fev\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/Projeto B está bloqueado para apontamentos de Fev\/2026/)).toBeInTheDocument()
  })

  it('renderiza o aviso de prazo proximo com a data limite', () => {
    render(
      <ProjectLockBanner
        lockedProjects={[]}
        upcomingDeadlines={[
          { projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-08', daysLeft: 3 },
        ]}
        month="2026-02"
      />,
    )
    expect(screen.getByText(/Você tem até 08\/02\/2026 para fechar Fev\/2026 no projeto Projeto A/)).toBeInTheDocument()
  })

  it('renderiza bloqueio e prazo proximo juntos', () => {
    render(
      <ProjectLockBanner
        lockedProjects={[
          { projectId: 'p1', projectName: 'Projeto A', deadline: '2026-02-05' },
        ]}
        upcomingDeadlines={[
          { projectId: 'p2', projectName: 'Projeto B', deadline: '2026-02-08', daysLeft: 3 },
        ]}
        month="2026-02"
      />,
    )
    expect(screen.getByText(/Projeto A está bloqueado/)).toBeInTheDocument()
    expect(screen.getByText(/Projeto B/)).toBeInTheDocument()
  })
})
