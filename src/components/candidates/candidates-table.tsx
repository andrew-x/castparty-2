import { Badge } from "@/components/common/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import day from "@/lib/dayjs"

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  createdAt: Date | string
  submissionCount: number
}

interface Props {
  candidates: Candidate[]
}

export function CandidatesTable({ candidates }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Submissions</TableHead>
          <TableHead>Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <TableCell className="font-medium text-foreground">
              {candidate.lastName}, {candidate.firstName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {candidate.email}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {candidate.phone ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{candidate.submissionCount}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {day(candidate.createdAt).format("LL")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
