package node.visitor;
import java.util.function.Predicate;


import node.DocumentNode;
import node.Node;
import node.RootNode;

public class MatchingVisitor implements NodeVisitor<Node> {
	
	Predicate<Node> predicate;
	
	private MatchingVisitor(Predicate<Node> p) {
		this.predicate = p;
	}

	@Override
	public Node visitDocumentNode(DocumentNode n) {	
		return n.accept(Flattener.get())
				.filter(i -> predicate.test(i))
				.findFirst()
				.orElseGet(() -> RootNode.getInstance());
	}

	@Override
	public Node visitRootNode(RootNode n) {
		return n;
	}
	
	public static MatchingVisitor matching(Predicate<Node> p) {
		return new MatchingVisitor(p);
	}


	

}
